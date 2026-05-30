const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const cors = require("cors");

const app = express();

// ======================================
// MIDDLEWARE
// ======================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended:true }));

app.use(express.static("public"));

// ======================================
// MONGODB CONNECTION
// ======================================

mongoose.connect(
  "mongodb://127.0.0.1:27017/expense_tracker"
)

.then(()=>{

  console.log("MongoDB Connected");

})

.catch((err)=>{

  console.log(err);

});

// ======================================
// TRANSACTION MODEL
// ======================================

const transactionSchema = new mongoose.Schema({

  category:String,

  amount:Number,

  type:String,

  month:String,

  description:String

});

const Transaction = mongoose.model(
  "Transaction",
  transactionSchema
);

// ======================================
// FILE STORAGE
// ======================================

const storage = multer.diskStorage({

  destination:(req,file,cb)=>{

    cb(null,"uploads/");

  },

  filename:(req,file,cb)=>{

    cb(
      null,
      Date.now() + "-" + file.originalname
    );

  }

});

const upload = multer({

  storage:storage

});

// ======================================
// CATEGORY DETECTION
// ======================================

function detectCategory(text){

  if(!text){

    return null;

  }

  const t = text.toLowerCase();

  // SHOPPING

  if(

    t.includes("amazon") ||
    t.includes("flipkart") ||
    t.includes("myntra") ||
    t.includes("ajio") ||
    t.includes("shopping") ||
    t.includes("store") ||
    t.includes("mart")

  ){

    return "Shopping";

  }

  // FOOD

  if(

    t.includes("zomato") ||
    t.includes("swiggy") ||
    t.includes("restaurant") ||
    t.includes("food") ||
    t.includes("cafe")

  ){

    return "Food";

  }

  // TRAVEL

  if(

    t.includes("uber") ||
    t.includes("ola") ||
    t.includes("metro") ||
    t.includes("travel") ||
    t.includes("petrol") ||
    t.includes("fuel") ||
    t.includes("bus") ||
    t.includes("train")

  ){

    return "Travel";

  }

  // HEALTH

  if(

    t.includes("hospital") ||
    t.includes("medical") ||
    t.includes("clinic") ||
    t.includes("pharmacy") ||
    t.includes("health")

  ){

    return "Health";

  }

  // EDUCATION

  if(

    t.includes("school") ||
    t.includes("college") ||
    t.includes("course") ||
    t.includes("education") ||
    t.includes("academy") ||
    t.includes("book")

  ){

    return "Education";

  }

  // ENTERTAINMENT

  if(

    t.includes("movie") ||
    t.includes("netflix") ||
    t.includes("spotify") ||
    t.includes("prime")

  ){

    return "Entertainment";

  }

  // SPORTS

  if(

    t.includes("gym") ||
    t.includes("sports")

  ){

    return "Sports";

  }

  // BILLS

  if(

    t.includes("electricity") ||
    t.includes("water") ||
    t.includes("wifi") ||
    t.includes("internet") ||
    t.includes("recharge") ||
    t.includes("bill") ||
    t.includes("airtel") ||
    t.includes("jio") ||
    t.includes("bsnl") ||
    t.includes("rent")

  ){

    return "Bills";

  }

  // UNKNOWN

  return null;

}

// ======================================
// PDF UPLOAD ROUTE
// ======================================

app.post(

  "/upload",

  upload.single("pdf"),

  async(req,res)=>{

    try{

      const pdfPath = req.file.path;

      const dataBuffer =
      fs.readFileSync(pdfPath);

      const pdfData =
      await pdfParse(dataBuffer);

      const text =
      pdfData.text;

      const lines =
      text.split("\n");

      await Transaction.deleteMany({});

      let transactions = [];

      const months = [

        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"

      ];

      let currentMonth = "Jan";

      for(let line of lines){

        line = line.trim();

        // ======================================
        // MONTH DETECTION
        // ======================================

        months.forEach((m)=>{

          if(
            line.toLowerCase().includes(
              m.toLowerCase()
            )
          ){

            currentMonth = m;

          }

        });

        // ======================================
        // AMOUNT DETECTION
        // ======================================

        const amounts = line.match(
          /\d+[,\d]*\.?\d*/g
        );

        if(amounts && amounts.length > 0){

          let amount = Number(

            amounts[amounts.length - 1]
            .replace(/,/g,"")

          );

          if(amount > 0){

            let type = "Expense";

            if(

              line.toLowerCase().includes("salary") ||
              line.toLowerCase().includes("credited") ||
              line.toLowerCase().includes("income")

            ){

              type = "Income";

            }

            const category =

            type === "Income"

            ? "Salary"

            : detectCategory(line);

            // ======================================
            // ADD ONLY VALID CATEGORY
            // ======================================

            if(category){

              const transaction = {

                category:category,

                amount:amount,

                type:type,

                month:currentMonth,

                description:line

              };

              transactions.push(transaction);

            }

          }

        }

      }

      await Transaction.insertMany(
        transactions
      );

      fs.unlinkSync(pdfPath);

      res.json({

        success:true,

        transactions:transactions

      });

    }

    catch(err){

      console.log(err);

      res.json({

        success:false,

        message:"PDF Parsing Failed"

      });

    }

  }

);

// ======================================
// GET TRANSACTIONS
// ======================================

app.get(

  "/transactions",

  async(req,res)=>{

    const data =
    await Transaction.find();

    res.json(data);

  }

);

// ======================================
// DELETE TRANSACTION
// ======================================

app.delete(

  "/delete/:id",

  async(req,res)=>{

    try{

      await Transaction.findByIdAndDelete(
        req.params.id
      );

      res.json({

        success:true

      });

    }

    catch(err){

      res.json({

        success:false

      });

    }

  }

);

// ======================================
// SERVER
// ======================================

app.listen(5000,()=>{

  console.log(
    "Server Running on port 5000"
  );

});