const getItemsByPageNum = (rootArray, perPage, currentPage) => {
  const perPageNum = parseInt(perPage);
  const currentPageNum = parseInt(currentPage);
  const items = rootArray.slice(perPage * currentPageNum - perPageNum, currentPageNum * perPageNum);

  return items;
};

const getTotalPage = (rootArray, perPage) => {
  const totalPage = Math.ceil(rootArray.length / perPage);
  return totalPage;
};

const commonValues = {
  perPage: 10,
  JWT_KEY: process.env.JWT_KEY,
};

const summaryData = (dataArr) => {
  const today = dataArr.filter((x) => (Date.now() - new Date(x.added)) / 86400000 <= 1);

  const last7Days = dataArr.filter((x) => (Date.now() - new Date(x.added)) / 86400000 <= 7);

  const last30Days = dataArr.filter((x) => (Date.now() - new Date(x.added)) / 86400000 <= 30);

  const last60Days = dataArr.filter((x) => (Date.now() - new Date(x.added)) / 86400000 <= 60);

  const last90Days = dataArr.filter((x) => (Date.now() - new Date(x.added)) / 86400000 <= 90);

  const last180Days = dataArr.filter((x) => (Date.now() - new Date(x.added)) / 86400000 <= 180);

  const last365Days = dataArr.filter((x) => (Date.now() - new Date(x.added)) / 86400000 <= 365);

  const summary = [
    { duration: "Today", amount: today.length, data: today },

    { duration: "Last 7 days", amount: last7Days.length, data: last7Days },

    { duration: "Last 30 days", amount: last30Days.length, data: last30Days },

    { duration: "Last 60 days", amount: last60Days.length, data: last60Days },

    { duration: "Last 90 days", amount: last90Days.length, data: last90Days },

    { duration: "Last 180 days", amount: last180Days.length, data: last180Days },

    { duration: "Last 365 days", amount: last365Days.length, data: last365Days },

    { duration: "All time", amount: dataArr.length, data: dataArr },
  ];
  return summary;
};

const encryptedLetterLibrary = [
  { key: " ", value: "<span>&#160;</span>" },
  { key: "$", value: "<span>&#36;</span>" },
  { key: "£", value: "<span>&#163;</span>" },
  { key: "%", value: "<span>&#37;</span>" },
  { key: "0", value: "<span>&#48;</span>" },
  { key: "1", value: "<span>&#49;</span>" },
  { key: "2", value: "<span>&#50;</span>" },
  { key: "3", value: "<span>&#51;</span>" },
  { key: "4", value: "<span>&#52;</span>" },
  { key: "5", value: "<span>&#53;</span>" },
  { key: "6", value: "<span>&#54;</span>" },
  { key: "7", value: "<span>&#55;</span>" },
  { key: "8", value: "<span>&#56;</span>" },
  { key: "9", value: "<span>&#57;</span>" },
  { key: "A", value: "<span>&#65;</span>" },
  { key: "B", value: "<span>&#66;</span>" },
  { key: "C", value: "<span>&#67;</span>" },
  { key: "D", value: "<span>&#68;</span>" },
  { key: "E", value: "<span>&#69;</span>" },
  { key: "F", value: "<span>&#70;</span>" },
  { key: "G", value: "<span>&#71;</span>" },
  { key: "H", value: "<span>&#72;</span>" },
  { key: "I", value: "<span>&#73;</span>" },
  { key: "J", value: "<span>&#74;</span>" },
  { key: "K", value: "<span>&#75;</span>" },
  { key: "L", value: "<span>&#76;</span>" },
  { key: "M", value: "<span>&#77;</span>" },
  { key: "N", value: "<span>&#78;</span>" },
  { key: "O", value: "<span>&#79;</span>" },
  { key: "P", value: "<span>&#80;</span>" },
  { key: "Q", value: "<span>&#81;</span>" },
  { key: "R", value: "<span>&#82;</span>" },
  { key: "S", value: "<span>&#83;</span>" },
  { key: "T", value: "<span>&#84;</span>" },
  { key: "U", value: "<span>&#85;</span>" },
  { key: "V", value: "<span>&#86;</span>" },
  { key: "W", value: "<span>&#87;</span>" },
  { key: "X", value: "<span>&#88;</span>" },
  { key: "Y", value: "<span>&#89;</span>" },
  { key: "Z", value: "<span>&#90;</span>" },
  { key: "a", value: "<span>&#97;</span>" },
  { key: "b", value: "<span>&#98;</span>" },
  { key: "c", value: "<span>&#99;</span>" },
  { key: "d", value: "<span>&#100;</span>" },
  { key: "e", value: "<span>&#101;</span>" },
  { key: "f", value: "<span>&#102;</span>" },
  { key: "g", value: "<span>&#103;</span>" },
  { key: "h", value: "<span>&#104;</span>" },
  { key: "i", value: "<span>&#105;</span>" },
  { key: "j", value: "<span>&#106;</span>" },
  { key: "k", value: "<span>&#107;</span>" },
  { key: "l", value: "<span>&#108;</span>" },
  { key: "m", value: "<span>&#109;</span>" },
  { key: "n", value: "<span>&#110;</span>" },
  { key: "o", value: "<span>&#111;</span>" },
  { key: "p", value: "<span>&#112;</span>" },
  { key: "q", value: "<span>&#113;</span>" },
  { key: "r", value: "<span>&#114;</span>" },
  { key: "s", value: "<span>&#115;</span>" },
  { key: "t", value: "<span>&#116;</span>" },
  { key: "u", value: "<span>&#117;</span>" },
  { key: "v", value: "<span>&#118;</span>" },
  { key: "w", value: "<span>&#119;</span>" },
  { key: "x", value: "<span>&#120;</span>" },
  { key: "y", value: "<span>&#121;</span>" },
  { key: "z", value: "<span>&#122;</span>" },
];

const sensitiveWordsLib = [
  "seen",
  "Buy",
  "direct",
  "Bank",
  "bank",
  "Buying",
  "judgments",
  "Clearance",
  "Order",
  "Orders",
  "shipped",
  "shopper",
  "Dig",
  "dirt",
  "Score",
  "babes",
  "XXX",
  "income",
  "boss",
  "business",
  "Double",
  "Earn",
  "$",
  "extra",
  "cash",
  "Expect",
  "earn",
  "Extra",
  "employment",
  "Homebased",
  "Income",
  "money",
  "Money",
  "biz",
  "opportunity",
  "Opportunity",
  "Potential",
  "earnings",
  "University",
  "diplomas",
  "Work",
  "$$$",
  "Affordable",
  "Bargain",
  "Beneficiary",
  "Best",
  "price",
  "Cash",
  "bonus",
  "Cashcashcash",
  "Cents",
  "dollar",
  "Cheap",
  "Check",
  "Claims",
  "Collect",
  "Compare",
  "rates",
  "Cost",
  "Credit",
  "Discount",
  "Easy",
  "terms",
  "Free",
  "just",
  "assets",
  "charges",
  "Incredible",
  "deal",
  "Insurance",
  "Investment",
  "Loans",
  "Million",
  "dollars",
  "Mortgage",
  "cost",
  "fees",
  "One",
  "hundred",
  "percent",
  "free",
  "Only",
  "Pennies",
  "Price",
  "Profits",
  "Pure",
  "profit",
  "Quote",
  "Refinance",
  "Save",
  "Serious",
  "Subject",
  "credit",
  "keep",
  "refund",
  "Unsecured",
  "debt",
  "US",
  "pay",
  "Accept",
  "cards",
  "Cards",
  "accepted",
  "order",
  "card",
  "offers",
  "Explode",
  "refund",
  "check",
  "Costs",
  "investment",
  "Requires",
  "initial",
  "Sent",
  "compliance",
  "Stock",
  "alert",
  "disclaimer",
  "statement",
  "bankruptcy",
  "Calling",
  "creditors",
  "support",
  "Consolidate",
  "Eliminate",
  "bad",
  "Financially",
  "independent",
  "paid",
  "Lower",
  "interest",
  "rate",
  "payment",
  "mortgage",
  "insurance",
  "Pre-approved",
  "Social",
  "security",
  "Acceptance",
  "Accordingly",
  "Avoid",
  "Chance",
  "Freedom",
  "Leave",
  "Lifetime",
  "Lose",
  "Maintained",
  "Medium",
  "Miracle",
  "Never",
  "Passwords",
  "Problem",
  "Reverses",
  "Sample",
  "Satisfaction",
  "Solution",
  "Stop",
  "Success",
  "Teen",
  "Wife",
  "Auto",
  "email",
  "Bulk",
  "Click",
  "remove",
  "Direct",
  "marketing",
  "Email",
  "Increase",
  "sales",
  "traffic",
  "Internet",
  "market",
  "Marketing",
  "Mass",
  "Member",
  "trial",
  "offer",
  "More",
  "Traffic",
  "Multi",
  "level",
  "Notspam",
  "mailing",
  "Open",
  "Opt",
  "Performance",
  "instructions",
  "Sale",
  "Sales",
  "Search",
  "Subscribe",
  "following",
  "junk",
  "spam",
  "Undisclosed",
  "recipient",
  "Unsubscribe",
  "Visit",
  "website",
  "hate",
  "believe",
  "Cures",
  "baldness",
  "Diagnostic",
  "Viagra",
  "delivery",
  "Human",
  "growth",
  "hormone",
  "Life",
  "weight",
  "Medicine",
  "medical",
  "exams",
  "pharmacy",
  "Removes",
  "wrinkles",
  "aging",
  "snoring",
  "Valium",
  "Vicodin",
  "Weight",
  "loss",
  "Xanax",
  "#1",
  "100%",
  "satisfied",
  "4U",
  "50%",
  "off",
  "Billion",
  "Join",
  "millions",
  "Americans",
  "guaranteed",
  "Thousands",
  "Being",
  "member",
  "Billing",
  "address",
  "Call",
  "Cannot",
  "combined",
  "other",
  "Confidentially",
  "orders",
  "Deal",
  "Financial",
  "freedom",
  "Gift",
  "certificate",
  "Giving",
  "away",
  "Guarantee",
  "Have",
  "been",
  "turned",
  "down?",
  "If",
  "only",
  "easy",
  "Important",
  "information",
  "regarding",
  "In",
  "accordance",
  "laws",
  "Long",
  "distance",
  "phone",
  "Mail",
  "Message",
  "contains",
  "Name",
  "brand",
  "Nigerian",
  "restrictions",
  "claim",
  "forms",
  "disappointment",
  "experience",
  "gimmick",
  "inventory",
  "middleman",
  "obligation",
  "purchase",
  "necessary",
  "questions",
  "asked",
  "selling",
  "strings",
  "attached",
  "No-obligation",
  "intended",
  "Obligation",
  "Off",
  "shore",
  "Offer",
  "Per",
  "Priority",
  "mail",
  "Prize",
  "Prizes",
  "Produced",
  "sent",
  "Reserves",
  "right",
  "Shopping",
  "spree",
  "Stuff",
  "sale",
  "Terms",
  "conditions",
  "best",
  "giving",
  "Trial",
  "Unlimited",
  "Unsolicited",
  "Vacation",
  "Warranty",
  "honor",
  "Weekend",
  "getaway",
  "What",
  "waiting",
  "for?",
  "Who",
  "really",
  "wins?",
  "Win",
  "Winner",
  "Winning",
  "Won",
  "winner!",
  "selected",
  "Winner!",
  "Cancel",
  "Copy",
  "accurately",
  "Give",
  "Print",
  "signature",
  "fax",
  "access",
  "consultation",
  "DVD",
  "gift",
  "grant",
  "hosting",
  "installation",
  "Instant",
  "leads",
  "membership",
  "preview",
  "priority",
  "quote",
  "sample",
  "natural",
  "Amazing",
  "Certified",
  "Congratulations",
  "Drastically",
  "reduced",
  "Fantastic",
  "Guaranteed",
  "effective",
  "Outstanding",
  "values",
  "Promise",
  "Real",
  "Risk",
  "Access",
  "Act",
  "now!",
  "Apply",
  "delete",
  "hesitate",
  "instant",
  "started",
  "Great",
  "Info",
  "requested",
  "Information",
  "Limited",
  "New",
  "customers",
  "Now",
  "expires",
  "Once",
  "lifetime",
  "Special",
  "promotion",
  "Supplies",
  "limited",
  "action",
  "Time",
  "Urgent",
  "supplies",
  "last",
  "Addresses",
  "Beverage",
  "Bonus",
  "Brand",
  "pager",
  "Cable",
  "converter",
  "Casino",
  "Celebrity",
  "DVDs",
  "Laser",
  "printer",
  "Legal",
  "Luxury",
  "car",
  "domain",
  "extensions",
  "Phone",
  "Rolex",
  "Stainless",
  "steel",
  "info",
  "Giveaway",
  "Risk-free",
  "Become",
  "Exclusive",
  "winner",
  "Confidentiality",
  "Dear",
  "friend",
  "Multi-level",
  "costs",
  "scam",
  "Debt",
  "solution",
  "Rates",
];



const blockLists = [
  "access.redhawk.org",
  "all.s5h.net",
  "b.barracudacentral.org",
  "bl.spamcop.net",
  "bl.tiopan.com",
  "blackholes.wirehub.net",
  "blacklist.sci.kun.nl",
  "block.dnsbl.sorbs.net",
  "blocked.hilli.dk",
  "bogons.cymru.com",
  "cbl.abuseat.org",
  "dev.null.dk",
  "dialup.blacklist.jippg.org",
  "dialups.mail-abuse.org",
  "dialups.visi.com",
  "dnsbl.abuse.ch",
  "dnsbl.anticaptcha.net",
  "dnsbl.antispam.or.id",
  "dnsbl.dronebl.org",
  "dnsbl.justspam.org",
  "dnsbl.kempt.net",
  "dnsbl.sorbs.net",
  "dnsbl.tornevall.org",
  "dnsbl-1.uceprotect.net",
  "duinv.aupads.org",
  "dnsbl-2.uceprotect.net",
  "dnsbl-3.uceprotect.net",
  "dul.dnsbl.sorbs.net",
  "escalations.dnsbl.sorbs.net",
  "hil.habeas.com",
  "black.junkemailfilter.com",
  "http.dnsbl.sorbs.net",
  "intruders.docs.uu.se",
  "ips.backscatterer.org",
  "korea.services.net",
  "mail-abuse.blacklist.jippg.org",
  "misc.dnsbl.sorbs.net",
  "msgid.bl.gweep.ca",
  "new.dnsbl.sorbs.net",
  "no-more-funn.moensted.dk",
  "old.dnsbl.sorbs.net",
  "opm.tornevall.org",
  "pbl.spamhaus.org",
  "proxy.bl.gweep.ca",
  "psbl.surriel.com",
  "pss.spambusters.org.ar",
  "rbl.schulte.org",
  "rbl.snark.net",
  "recent.dnsbl.sorbs.net",
  "relays.bl.gweep.ca",
  "relays.mail-abuse.org",
  "relays.nether.net",
  "rsbl.aupads.org",
  "sbl.spamhaus.org",
  "smtp.dnsbl.sorbs.net",
  "socks.dnsbl.sorbs.net",
  "spam.dnsbl.sorbs.net",
  "spam.olsentech.net",
  "spamguard.leadmon.net",
  "spamsources.fabel.dk",
  "ubl.unsubscore.com",
  "web.dnsbl.sorbs.net",
  "xbl.spamhaus.org",
  "zen.spamhaus.org",
  "zombie.dnsbl.sorbs.net",
  "bl.mailspike.net",
  "blacklist.woody.ch",
  "combined.abuse.ch",
  "db.wpbl.info",
  "drone.abuse.ch",
  "dyna.spamrats.com",
  "ix.dnsbl.manitu.net",
  "noptr.spamrats.com",
  "orvedb.aupads.org",
  "singular.ttk.pte.hu",
  "spam.abuse.ch",
  "spam.dnsbl.anonmails.de",
  "spam.spamrats.com",
  "spambot.bls.digibase.ca",
  "spamrbl.imp.ch",
  "ubl.lashback.com",
  "virus.rbl.jp",
  "wormrbl.imp.ch",
  "z.mailspike.net",
];

const DEAD_MAIL_STATUS = {
  INVALID: "none",
  FREE_MAIL: "free-email",
  OFFICIAL: "official",
  ROLES: "role-based",
  SPAM_TRAP: "spam-trap",
  DISPOSABLE: "disposable",
};

exports.getItemsByPageNum = getItemsByPageNum;
exports.getTotalPage = getTotalPage;
exports.summaryData = summaryData;
exports.commonValues = commonValues;
exports.encryptedLetterLibrary = encryptedLetterLibrary;
exports.sensitiveWordsLib = sensitiveWordsLib;
// exports.processTextToArray = processTextToArray;
exports.blockLists = blockLists;
exports.DEAD_MAIL_STATUS = DEAD_MAIL_STATUS;
