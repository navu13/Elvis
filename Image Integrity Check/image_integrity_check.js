'use strict';

const oracledb = require('oracledb');
const dbConfig = require('./dbconfig.js');
const { exec, execSync, spawnSync, spawn } = require('child_process');
const fs = require('fs');

const missingLog = "logs/missing.log"
const failLog = "logs/fail.log"
const successLog = "logs/success.log"

const debug = false

function logIt(message, settings) {
	if (settings === undefined) settings = {}
	if (settings.console === undefined) settings.console = true;
	if (settings.console == true) console.log(message);
	if (settings.file !== undefined) {
		try {
			fs.appendFileSync(settings.file, `${message}\n`)
		} catch (e) {
			console.log ( `${message}\tError: ${e}`) 
		}
	}
}

function Exec (command) {
  return new Promise((done, failed) => {
    exec(command, (err, stdout, stderr) => {
      done({ err, stdout, stderr })
      //failed(err)
    })
  })
}


try { fs.unlinkSync(missingLog) } catch (err) {}
try { fs.unlinkSync(failLog) } catch (err) {}
try { fs.unlinkSync(successLog) } catch (err) {}
try { fs.rmdirSync('logs', {recursive: true}) } catch (err) {}
try { fs.mkdirSync('logs') } catch (err) {}


async function probe(row){
  	
  	if (!fs.existsSync(row.AX_FILE_PATH)) {
		logIt(`${row.ID_OBJET}\t${row.AX_FILE_PATH}`, {file: missingLog, console: debug})
		return
	}


	try{
		
		let { err, stdout, stderr } = await Exec(`"C:\\Program Files\\ImageMagick-7.0.9-Q16\\magick.exe" convert ${row.AX_FILE_PATH} -regard-warnings -resize 32x32 preview.jpg`)
		
		if (err) {
			
			logIt(`${row.ID_OBJET}\t${row.AX_FILE_PATH}`, {file: failLog, console: debug})
			
			var dataArray = `${stderr}`.split('\n')

			var filtered = dataArray.filter( (element) => {
				return element != null && element != '';
			});

			filtered.map( (element) => {
				logIt(`${element.replace(/ \`.+/gi, '')}`, {file: failLog, console: debug})
			})
			logIt('', {file: failLog, console: debug})

		} else {
		
			logIt(`${row.ID_OBJET}\t${row.AX_FILE_PATH}`, {file: successLog, console: debug})

		}
		
		try { fs.unlinkSync('preview.jpg') } catch (err) {}

	} catch (e) {
			logIt(`App error: ${e}`)
	}
}

async function run() {

// 	await probe('samples/8b32db4a-8c3f-4f6d-8fb1-2bf45ca824f0.tiff')
	
	let oracleConnection;
    let options, result;
    
    try {
        oracleConnection = await oracledb.getConnection(dbConfig);
        logIt('Connection to Oracle was successful!');

        await oracleConnection.execute(`alter session set current_schema = "ORPHEA"`);

        options = { outFormat: oracledb.OUT_FORMAT_OBJECT };
		
		let result = await oracleConnection.execute(
			`
			select 
				fichiers.id_objet,
				VOLUMES.PC_VOL_NAME || VOLUMES.PC_ROOT || FICHIERS.REP_PC || FICHIERS.NOM_FICHIER ax_file_path
			from fichiers 
			left outer join VOLUMES ON VOLUMES.ID_VOLUME = FICHIERS.ID_VOLUME

			where 
				fichiers.id_type = 4 
				and fichiers.signature in ('.tiff', '.bmp', '.png', '.tif', '.jpg', '.jpe', '.jpeg', '.gif' )
				and fichiers.id_objet between 150000 and 160000-1 -- including
			`, {}, options);
		
		
		var total = result.rows.length
		logIt(`Found ${total} records`)
		//probe (result.rows[1]); return
		
		var total
		for (var row of result.rows) {
			await probe (row);
			if (total % 100 == 0) {
				logIt (`Remains ${total}`)
			}
			total--


		}

    } catch (err) {
        logIt(err);
    } finally {
        if (oracleConnection) {
            try {
                await oracleConnection.close();
            } catch (err) {
                logIt(err);
            }
        }
    }
}


run()