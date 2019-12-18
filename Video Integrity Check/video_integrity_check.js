'use strict';

const oracledb = require('oracledb');
const dbConfig = require('./dbconfig.js');
const fs = require("fs");
var ffprobe = require('ffprobe');
var ffmpeg = require('ffmpeg');

const missingLog = "missing.log"
const probeFailLog = "probeFail.log"
const previewFailLog = "previewFail.log"

try {
  fs.unlinkSync(missingLog);
} catch (err) {
}

function probe(row1){
	if (!fs.existsSync(row1.AX_FILE_PATH)) {
		fs.appendFileSync(missingLog, `${row1.ID_OBJET}\t${row1.AX_FILE_PATH}\n`)
		return
	}
	
	ffprobe(row1.AX_FILE_PATH, { path: 'ffmpeg\\bin\\ffprobe.exe' }, function (err, info) {
		if (err) { 
			fs.appendFileSync(probeFailLog, `${row1.ID_OBJET}\t${row1.AX_FILE_PATH}\t${err}\n`) 
		} else {
			//console.log(`${row1.ID_OBJET}\t${row1.AX_FILE_PATH}\t${info.streams[0].codec_name}`);

			ffmpeg(row1.AX_FILE_PATH, { path: 'ffmpeg\\bin\\ffmpeg.exe', previewPath: `previews\\${row1.ID_OBJET}.jpg` }, function (errp, infop) {
				if (errp) { 
					try {
						fs.appendFileSync(previewFailLog, `${row1.ID_OBJET}\t${row1.AX_FILE_PATH}\t${errp}\n`)
					} catch (e) {
						console.log ( `${row1.ID_OBJET}\t${row1.AX_FILE_PATH}\t${errp}\t{e}`) 
					}
						
					
				} 
			});

			
		}
	});

}

async function run() {

    let oracleConnection;
    let sql, binds, options, result;

    let sqliteConnection;

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
		
		let result = await oracleConnection.execute(
			`
			select 
				fichiers.id_objet,
				VOLUMES.PC_VOL_NAME || VOLUMES.PC_ROOT || FICHIERS.REP_PC || FICHIERS.NOM_FICHIER ax_file_path
			from fichiers 
			left outer join VOLUMES ON VOLUMES.ID_VOLUME = FICHIERS.ID_VOLUME

			where 
				fichiers.id_type = 4 
				and fichiers.signature in ('.mp4', '.avi', '.f4v', '.mov', '.wmv', '.mkv', '.mts', '.mpg' )
				
			`, binds, options);
		
		
		console.log(`Found ${result.rows.length} records`)
		//probe (result.rows[1]); return
		
		for (var row of result.rows) {
			probe (row);

		}
				
		return

 
       


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