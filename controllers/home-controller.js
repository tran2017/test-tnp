const HttpError = require("../models/http-error");
const homeSummary = require("../models/summary");
const other = require("../models/other");
var fs = require("fs");
var path = require("path");
const { promises: fsPromises } = require("fs");
const { summaryData } = require("../shared/engine");

const LEADSS = [
  { Id: "c1b3be5b-0egt-442b-902b-f22a1a512201", Email: "kb25286@ou.ac.uk", Password: "529464.3116022892", Country: "USA", Provider: "Office", Added: "3/2/2023" },
  { Id: "c1b3be5b-0egt-442b-902b-f22a1a512201", Email: "abc@ou.ac.uk", Password: "529464.3116022892", Country: "USA", Provider: "Office", Added: "2/27/2023" },
  { Id: "c168be5b-0e8a-442b-902b-f54a1a512201", Email: "aaaaaaaa", Password: "529464.3116022892", Country: "USA", Provider: "Office", Added: "5/6/2022" },
  { Id: "3a98b3f5-995a-4ce5-82bb-ed117b69ec78", Email: "nbbbbbbbb", Password: "947893.8916396727", Country: "USA", Provider: "Office", Added: "10/3/2022" },
  { Id: "3d8faf8d-64be-482f-9f2d-e79e8ce06065", Email: "ccccccccc", Password: "430203.20066844684", Country: "USA", Provider: "Office", Added: "9/8/2022" },
  { Id: "6f74e911-7469-4772-962e-0db610545f4d", Email: "nnnnnnn", Password: "945812.3531629981", Country: "USA", Provider: "Office", Added: "3/19/2022" },
  { Id: "343a36ad-0a54-4402-b958-9fca8ec2fa17", Email: "mmmmmm@ou.ac.uk", Password: "554483.340138815", Country: "USA", Provider: "Office", Added: "9/27/2022" },
  { Id: "17a566cd-db33-4cd2-8bb8-719b3f86864f", Email: "rrrrrr@ou.ac.uk", Password: "497488.0706719622", Country: "USA", Provider: "Office", Added: "4/2/2022" },
  { Id: "7a52b29b-f19d-4448-8e48-bf63ffcffb89", Email: "oooooo@ou.ac.uk", Password: "309152.018007405", Country: "USA", Provider: "Office", Added: "10/9/2022" },
  { Id: "1e7ca431-624e-4d25-a976-3b1eb89ae943", Email: "mmmmmm@ou.ac.uk", Password: "324107.9744656206", Country: "USA", Provider: "Office", Added: "8/7/2022" },
  { Id: "f08ebc11-027f-4f16-88ae-5655b39b823e", Email: "qqqqqq@ou.ac.uk", Password: "930794.9268815485", Country: "USA", Provider: "Office", Added: "1/14/2023" },
  { Id: "8c10e5d3-0fba-476e-9d04-73cdd05a9219", Email: "sssss@ou.ac.uk", Password: "870365.4786116963", Country: "USA", Provider: "Office", Added: "6/25/2022" },
  { Id: "251bae30-2245-42cc-8c38-058b9d67994e", Email: "kb25286@ou.ac.uk", Password: "543198.8276872268", Country: "USA", Provider: "Office", Added: "3/2/2023" },
];

// Get timezone
// Intl.DateTimeFormat().resolvedOptions().timeZone
// new Date(Date.now()).toLocaleString("en-US", { timeZone: "Asia/Bangkok" }),

const SUMMARY = [{ Lastlogin: "2023-02-20 4:44pm", TotalLeads: 999, TotalPhone: 9999, TotalFullz: 99999, IsLoggedIn: true }];

// const getHomeDataSummary = (req, res, next) => {
//   const today = LEADSS.filter((x) => (Date.now() - new Date(x.Added)) / 86400000 <= 1).length;
//   const last7Days = LEADSS.filter((x) => (Date.now() - new Date(x.Added)) / 86400000 <= 7).length;
//   const last30Days = LEADSS.filter((x) => (Date.now() - new Date(x.Added)) / 86400000 <= 30).length;
//   const last60Days = LEADSS.filter((x) => (Date.now() - new Date(x.Added)) / 86400000 <= 60).length;
//   const last90Days = LEADSS.filter((x) => (Date.now() - new Date(x.Added)) / 86400000 <= 90).length;
//   const last180Days = LEADSS.filter((x) => (Date.now() - new Date(x.Added)) / 86400000 <= 180).length;
//   const last365Days = LEADSS.filter((x) => (Date.now() - new Date(x.Added)) / 86400000 <= 365).length;
//   const allTime = LEADSS.length;
//   const leads_summary = {
//     today,
//     last7Days,
//     last30Days,
//     last60Days,
//     last90Days,
//     last180Days,
//     last365Days,
//     allTime,
//   };

//   if (!leads_summary) {
//     return next(new HttpError("Summry leads error", 404));
//   }

//   res.status(200).json({ leads_summary });
// };
;

const getHomeDataSummary = async (req, res, next) => {
  try {
    const allOthers = await other.find().exec();
    const allOthersConverter = allOthers.map(x=> x.toObject({getters:true}));
    const intro = [
      { name: "Total results: ", value: allOthers.length },
    ];
    const otherDataByDuration = summaryData(allOthers);

    const homeData = {
      homeIntro: intro,
      homeDataTables: otherDataByDuration,
      totalItems: allOthersConverter
    };

    res.status(200).json(homeData);
  } catch (error) {
    return next(new HttpError("Load home data failed.", 500));
  }
};

function randomDate(start, end, startHour, endHour) {
  var date = new Date(+start + Math.random() * (end - start));
  var hour = (startHour + Math.random() * (endHour - startHour)) | 0;
  date.setHours(hour);
  return date;
}

const country_list = ["US", "UK", "CA", "US", "AU", "FR", "DE", "ES", "CN", "US", "CN", "CN", "KR", "KR", "KR", "US", "JP", "JP", "JP", "SWE", "HK", "NL", "US", "US"];

const initializeHomeData = async (req, res, next) => {
  // const fullz_path = await fsPromises.readFile(path.join(__dirname, "./ssh 1.txt"), "utf-8");
  // const array = fullz_path.toString().replace(/\r\n/g, "\n").split("\n");
  // for (let index = 0; index < array.length; index++) {
  //   const split = array[index].split("|");
  //   // const newFullz = new fullz({
  //   //   name: split[0],
  //   //   country: "US",
  //   //   state: split[1],
  //   //   city: split[2],
  //   //   address: split[3],
  //   //   phone: split[5],
  //   //   email: split[6],
  //   //   sex: split[7],
  //   //   dob: split[8],
  //   //   ssn: split[9],
  //   //   added: randomDate(new Date(2022, 0, 1), new Date(), 0, 24).toLocaleString(),
  //   // });
  //   const newPhone = new other({
  //     item: `${split[0]}|${split[1]}|${split[2]}|${split[3]}`,
  //     type: "SSH",
  //     added: randomDate(new Date(2022, 0, 5), new Date(), 0, 24).toLocaleString(),
  //   });
  //   try {
  //     await newPhone.save();
  //   } catch (error) {
  //     // return next(new HttpError("Adding new leads failed. Please try again", 500));
  //     continue;
  //   }
  // }
};

exports.getHomeDataSummary = getHomeDataSummary;
exports.initializeHomeData = initializeHomeData;
