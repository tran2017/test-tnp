// "use strict";

// var lookup =  require('../index'),
// 	address = "http://newbiea-z.blogspot.com/",	
// 	list = require('../list/dnsbl_list.json'),
// 	util = require('util'),
// 	net = require('net'),
// 	limit = 200,
// 	fs = require('fs'),
// 	handle;

// if(list){
// 	try{
// 		var data = fs.readFileSync(list,{encoding:'utf8'});
// 		list = data.split(/\n|\r\n/);		
// 	}
// 	catch(err){
// 		util.error(err);
// 		return ;
// 	}
// }

// if(!net.isIP(address)){
// 	handle = lookup.uribl;
// }
// else{
// 	handle = lookup.dnsbl;
// }

// var inst = new handle(address,list,limit);
// console.log('\n***** Starting Lookup ******\n')
// inst.on('data',function(res,bl){
// 	var zone = bl.zone || bl;
// 	console.log(res.status, zone, res.TXT||'');
// });
// inst.on('error',function(err,bl){
// 	var zone = bl.zone || bl;
// 	console.log('error', zone, err.code);
// });
// inst.on('done',function(){
// 	console.log('\n***** Finished ******')
// });