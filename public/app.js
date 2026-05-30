let transactions = [];

let pieChart;
let monthlyChart;

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

// =========================
// PDF UPLOAD
// =========================

async function uploadPDF(){

  const file =
  document.getElementById("pdfFile").files[0];

  if(!file){

    alert("Upload PDF First");

    return;

  }

  const formData =
  new FormData();

  formData.append("pdf",file);

  const res =
  await fetch("/upload",{

    method:"POST",

    body:formData

  });

  const data =
  await res.json();

  if(data.success){

    transactions =
    data.transactions;

    updateDashboard();

  }

}

// =========================
// DELETE
// =========================

function deleteTransaction(index){

  transactions.splice(index,1);

  updateDashboard();

}

// =========================
// DASHBOARD
// =========================

function updateDashboard(){

  let totalIncome = 0;

  let totalExpense = 0;

  const categoryTotals = {};

  const monthlyIncome =
  new Array(12).fill(0);

  const monthlyExpense =
  new Array(12).fill(0);

  const monthlyReasons = {};

  const tableBody =
  document.getElementById("transactionTable");

  tableBody.innerHTML = "";

  transactions.forEach((t,index)=>{

    const amount =
    Number(t.amount);

    const monthIndex =
    months.indexOf(t.month);

    if(t.type === "Income"){

      totalIncome += amount;

      if(monthIndex !== -1){

        monthlyIncome[monthIndex] += amount;

      }

    }

    else{

      totalExpense += amount;

      if(monthIndex !== -1){

        monthlyExpense[monthIndex] += amount;

      }

      if(!categoryTotals[t.category]){

        categoryTotals[t.category] = 0;

      }

      categoryTotals[t.category] += amount;

      if(!monthlyReasons[t.month]){

        monthlyReasons[t.month] = [];

      }

      if(
        !monthlyReasons[t.month]
        .includes(t.category)
      ){

        monthlyReasons[t.month]
        .push(t.category);

      }

    }

    tableBody.innerHTML += `

    <tr>

      <td>${t.category}</td>

      <td>₹${t.amount}</td>

      <td>${t.type}</td>

      <td>${t.month}</td>

      <td>

      <button
      class="delete-btn"
      onclick="deleteTransaction(${index})"
      >

      Delete

      </button>

      </td>

    </tr>

    `;

  });

  const balance =
  totalIncome - totalExpense;

  document.getElementById(
    "totalIncome"
  ).innerText =
  "₹" + totalIncome;

  document.getElementById(
    "totalExpense"
  ).innerText =
  "₹" + totalExpense;

  document.getElementById(
    "balance"
  ).innerText =
  "₹" + balance;

  // =========================
  // REMOVE OTHER
  // =========================

  delete categoryTotals["Other"];

// =========================
// PIE CHART
// =========================

if(pieChart){

  pieChart.destroy();

}

pieChart = new Chart(

  document.getElementById("pieChart"),

  {

    type:"pie",

    data:{

      labels:Object.keys(categoryTotals),

      datasets:[{

        data:Object.values(categoryTotals),

        backgroundColor:[

          "#8b5cf6",
          "#a855f7",
          "#b784f7",
          "#7c3aed",
          "#6366f1",
          "#06b6d4",
          "#14b8a6",
          "#f472b6",
          "#f59e0b"

        ]

      }]

    },

    options:{

      responsive:true,

      maintainAspectRatio:false,

      animation:{

        animateRotate:true,

        animateScale:true,

        duration:2000,

        easing:'easeOutBounce'

      },

      plugins:{

        legend:{

          labels:{

            color:"#4b5563",

            font:{

              size:16,

              weight:'600'

            }

          }

        }

      }

    }

  }

);

 // =========================
// BAR CHART
// =========================

if(monthlyChart){

  monthlyChart.destroy();

}

monthlyChart = new Chart(

  document.getElementById("monthlyChart"),

  {

    type:"bar",

    data:{

      labels:months,

      datasets:[

        {

          label:"Income",

          data:monthlyIncome,

          backgroundColor:"#8b5cf6",

          borderRadius:20,

          borderSkipped:false,

          barThickness:22

        },

        {

          label:"Expense",

          data:monthlyExpense,

          backgroundColor:"#ec4899",

          borderRadius:20,

          borderSkipped:false,

          barThickness:22

        }

      ]

    },

    options:{

      responsive:true,

      maintainAspectRatio:false,

      animation:{

        duration:2500,

        easing:'easeOutQuart'

      },

      scales:{

        x:{

          ticks:{

            color:"#4b5563",

            font:{

              size:14,

              weight:'600'

            }

          }

        },

        y:{

          ticks:{

            color:"#4b5563",

            font:{

              size:14

            }

          }

        }

      },

      plugins:{

        legend:{

          labels:{

            color:"#374151",

            font:{

              size:16,

              weight:'700'

            }

          }

        }

      }

    }

  }

);

  // =========================
  // SMART INSIGHTS
  // =========================

  let highestCategory = "";

  let highestAmount = 0;

  for(let category in categoryTotals){

    if(categoryTotals[category] > highestAmount){

      highestAmount =
      categoryTotals[category];

      highestCategory =
      category;

    }

  }

  let highestExpenseMonth = "";

  let highestMonthAmount = 0;

  monthlyExpense.forEach((amt,index)=>{

    if(amt > highestMonthAmount){

      highestMonthAmount = amt;

      highestExpenseMonth =
      months[index];

    }

  });

  const reasons =

  monthlyReasons[highestExpenseMonth]
  ?.slice(0,3)
  .join(", ");

  document.getElementById(
    "insights"
  ).innerHTML = `

  <h3>
  Highest Spending Category:
  ${highestCategory}
  </h3>

  <p>
  Warning:
  Reduce spending on
  <b>${highestCategory}</b>
  </p>

  <p>
  Total Spent:
  ₹${highestAmount}
  </p>

  <br>

  <h3>
  Highest Expense Month:
  ${highestExpenseMonth}
  </h3>

  <p>
  Reason:
  High spending detected in:
  ${reasons}
  </p>

  `;

}
// =========================
// LOGOUT
// =========================

function logout(){

  localStorage.removeItem(
    "loggedIn"
  );

  window.location.href =
  "index.html";

}