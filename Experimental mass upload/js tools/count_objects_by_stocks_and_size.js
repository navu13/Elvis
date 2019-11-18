'use strict';

const oracledb = require('oracledb');
const dbConfig = require('./dbconfig.js');
const fs = require("fs");

function sqlRange(loVal, hiVal, stockId) {
	// in megabytes 1 000 000
    
    var stockSearch = (typeof(stockId) !== undefined) ? `\nand id_stock = ${stockId}` : '';
    const sqlRequest = `
select count(*) HITS from (
select
   OBJETS.ID_OBJET,
   objets.id_stock,
   objets.ID_TYPE_DOC,
   FICHIERS.ID_FICHIER,
   images.physical_size
   
from objets 
left outer join FICHIERS on objets.id_objet = fichiers.id_objet and FICHIERS.ID_TYPE = 4 
left outer join images on FICHIERS.ID_FICHIER = images.ID_FICHIER
)
where physical_size between ${loVal*1000*1000} and ${hiVal*1000*1000}-1
and id_stock = ${stockId}
`;
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
		
		
		let stocks = await oracleConnection.execute('select * from stocks order by id_stock', binds, options);
		//console.log(stocks.rows);

		let loVal, hiVal;
		
		for (const [i, item] of stocks.rows.entries()) {
			console.log(`\n\n${item.ID_STOCK}: ${item.LIB_STOCK}`);
			console.log(`=======================================`);
			
			loVal = 0; hiVal = 1;
			result = await oracleConnection.execute(sqlRange(loVal, hiVal, item.ID_STOCK), binds, options);
			console.log(`range ${loVal}..${hiVal}: ${result.rows[0].HITS}`);

			loVal = 1; hiVal = 5;
			result = await oracleConnection.execute(sqlRange(loVal, hiVal, item.ID_STOCK), binds, options);
			console.log(`range ${loVal}..${hiVal}: ${result.rows[0].HITS}`);

			loVal = 5; hiVal = 10;
			result = await oracleConnection.execute(sqlRange(loVal, hiVal, item.ID_STOCK), binds, options);
			console.log(`range ${loVal}..${hiVal}: ${result.rows[0].HITS}`);

			loVal = 10; hiVal = 15;
			result = await oracleConnection.execute(sqlRange(loVal, hiVal, item.ID_STOCK), binds, options);
			console.log(`range ${loVal}..${hiVal}: ${result.rows[0].HITS}`);

			loVal = 15; hiVal = 25;
			result = await oracleConnection.execute(sqlRange(loVal, hiVal, item.ID_STOCK), binds, options);
			console.log(`range ${loVal}..${hiVal}: ${result.rows[0].HITS}`);

			loVal = 25; hiVal = 100;
			result = await oracleConnection.execute(sqlRange(loVal, hiVal, item.ID_STOCK), binds, options);
			console.log(`range ${loVal}..${hiVal}: ${result.rows[0].HITS}`);

			loVal = 100; hiVal = 10000;
			result = await oracleConnection.execute(sqlRange(loVal, hiVal, item.ID_STOCK), binds, options);
			console.log(`range ${loVal}..${hiVal}: ${result.rows[0].HITS}`);
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