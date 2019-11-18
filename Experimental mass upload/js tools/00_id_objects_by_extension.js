'use strict';

const oracledb = require('oracledb');
const dbConfig = require('./dbconfig.js');
const fs = require("fs");

async function run() {

    let oracleConnection;
    let sql, binds, options, result;

    let sqliteConnection;

	async function execute(ext) {
				
		let result = await oracleConnection.execute(
			`select id_objet from fichiers where id_type = 4 and signature = '${ext}' order by id_objet`
		, binds, options);
		
		console.log(`[${ext}]`);
		result.rows.map( function (item) {
			console.log(item.ID_OBJET)
        })
		console.log(`[/${ext}]\n`);
	}
	
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
		
		await execute('.ai');
		await execute('.eps');
		await execute('.tiff');
		await execute('.f4v');
		await execute('.bmp');
		await execute('.mp4');
		await execute('.mov');
		await execute('.png');
		await execute('.wmv');
		await execute('.tif');
		await execute('.jpe');
		await execute('.jpeg');
		await execute('.mkv');
		await execute('.gif');
		await execute('.mts');
		await execute('.avi');
		await execute('.pdf');
		await execute('.mpg');

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