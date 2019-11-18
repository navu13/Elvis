'use strict';

const oracledb = require('oracledb');
const dbConfig = require('./dbconfig.js');
const fs = require("fs");




let needObjects = 100000;
let totalObjects = 0;

let xDataHeaderString = `|=id_stock|=lib_stock|=<1|=1–5|=5–10|=10–15|=15–25|=25–100|=>100`;
let xDataHeader = xDataHeaderString.substr(2).split('|=');

let xDataBuffer = fs.readFileSync('files_by_stock_data.txt');
let xDataRows = `${xDataBuffer}`.split('\n')
let xData = [] ;
xDataRows.map(function (row) {
    let tempRow = row.substr(1).split('|');
    xData.push(tempRow)
})

// count total count of objects
xData.map(function (row) {
    row.map(function(item, col){
        if (col > 1)
            totalObjects += parseInt(item);
    })
})

// recalculate needed number of objects per cell
xData.map(function (row) {
    row.map(function(item, col){
        if (col > 1)
            row[col] = Math.ceil(item/totalObjects*needObjects);
    })
})



function sqlRange(loVal, hiVal, stockId, count) {
	// in megabytes 1 000 000
    
    var stockSearch = (typeof(stockId) !== undefined) ? `\nand id_stock = ${stockId}` : '';
    const sqlRequest = `
select * from (
select * from (
select
   OBJETS.ID_OBJET,
   objets.id_stock,
   objets.ID_TYPE_DOC,
   FICHIERS.ID_FICHIER,
   images.physical_size
   
from objets 
left outer join FICHIERS on objets.id_objet = fichiers.id_objet and FICHIERS.ID_TYPE = 4 and fichiers.signature = '.jpg'
left outer join images on FICHIERS.ID_FICHIER = images.ID_FICHIER
)
where physical_size between ${loVal*1000*1000} and ${hiVal*1000*1000}
and id_stock = ${stockId}
order by dbms_random.value
) where rownum <= ${count}
`
	//console.log(sqlRequest)
	return sqlRequest
}

async function run() {

    let oracleConnection;
    let sql, binds, options, result;

    try {
        // Get a non-pooled connection
        oracleConnection = await oracledb.getConnection(dbConfig);
        console.log('Connection to Oracle was successful!');

        await oracleConnection.execute(`alter session set current_schema = "ORPHEA"`);

        // Query the data
        binds = {};

        // For a complete list of options see the documentation.
        options = {
            outFormat: oracledb.OUT_FORMAT_OBJECT ,  // query result format
            // extendedMetaData: true,   // get extra metadata
            // fetchArraySize: 100       // internal buffer allocation size for tuning
        };
		

		for (const [id, label, x1, x2, x3, x4, x5, x6, x7] of xData) {
			//console.log(id, label, x1, x2, x3, x4, x5, x6, x7)
			
			console.log(`#${id}_<1#${x1}`);
			result = await oracleConnection.execute(sqlRange(0, 1, id, x1), binds, options);
			result.rows.map(function (row) { console.log(row.ID_OBJET); })
			console.log(`#/${id}_<1\n`);
			
			console.log(`#${id}_1–5#${x2}`);
			result = await oracleConnection.execute(sqlRange(1, 5, id, x2), binds, options);
			result.rows.map(function (row) { console.log(row.ID_OBJET); })
			console.log(`#/${id}_1–5\n`);
			
			console.log(`#${id}_5–10#${x3}`);
			result = await oracleConnection.execute(sqlRange(5, 10, id, x3), binds, options);
			result.rows.map(function (row) { console.log(row.ID_OBJET); })
			console.log(`#/${id}_5–10\n`);
			
			console.log(`#${id}_10–15#${x4}`);
			result = await oracleConnection.execute(sqlRange(10, 15, id, x4), binds, options);
			result.rows.map(function (row) { console.log(row.ID_OBJET); })
			console.log(`#/${id}_10–15\n`);
			
			console.log(`#${id}_15–25#${x5}`);
			result = await oracleConnection.execute(sqlRange(15, 25, id, x5), binds, options);
			result.rows.map(function (row) { console.log(row.ID_OBJET); })
			console.log(`#/${id}_15–25\n`);
			
			console.log(`#${id}_25–100#${x6}`);
			result = await oracleConnection.execute(sqlRange(25, 100, id, x6), binds, options);
			result.rows.map(function (row) { console.log(row.ID_OBJET); })
			console.log(`#/${id}_25–100\n`);
			
			console.log(`#${id}_>100#${x7}`);
			result = await oracleConnection.execute(sqlRange(100, 10000, id, x7), binds, options);
			result.rows.map(function (row) { console.log(row.ID_OBJET); })
			console.log(`#/${id}_>100\n`);
			
		}
		

    } catch (err) {
        console.error(err);
    } finally {
        if (oracleConnection) {
            try {
                await oracleConnection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}

run();