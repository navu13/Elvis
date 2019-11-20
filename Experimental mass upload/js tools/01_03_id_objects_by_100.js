'use strict';

const oracledb = require('oracledb');
const dbConfig = require('./dbconfig.js');
const fs = require("fs");

async function run() {

    let oracleConnection;
    let sql, binds, options, result;

    try {
        // Get a non-pooled connection
        oracleConnection = await oracledb.getConnection(dbConfig);
//         console.log('Connection to Oracle was successful!');

        await oracleConnection.execute(`alter session set current_schema = "ORPHEA"`);

        // Query the data
        binds = {};

        // For a complete list of options see the documentation.
        options = {
            outFormat: oracledb.OUT_FORMAT_OBJECT ,  // query result format
            // extendedMetaData: true,   // get extra metadata
            // fetchArraySize: 100       // internal buffer allocation size for tuning
        };
		

// ======= smallest files		
		console.log(`#01#jpg by size smallest`);
		result = await oracleConnection.execute(`
select id_objet from (
select 
    id_objet,
    imagesize
from (
    select 
      fichiers.id_objet,
      images.physical_size imagesize
    from fichiers 
    left join images on images.id_fichier = fichiers.id_fichier 
    where 
      fichiers.id_type = 4 and fichiers.signature = '.jpg' and images.physical_size is not null
) 
order by imagesize )
where rownum <= 100
`, binds, options);
		result.rows.map(function (row) { console.log(row.ID_OBJET); })
		console.log(`#01#jpg by size smallest\n`);

// ======= largest files
		console.log(`#02#jpg by size largest`);
		result = await oracleConnection.execute(`
select id_objet from (
select 
    id_objet,
    imagesize
from (
    select 
      fichiers.id_objet,
      images.physical_size imagesize
    from fichiers 
    left join images on images.id_fichier = fichiers.id_fichier 
    where 
      fichiers.id_type = 4 and fichiers.signature = '.jpg' and images.physical_size is not null
) 
order by imagesize desc)
where rownum <= 100
`, binds, options);
		result.rows.map(function (row) { console.log(row.ID_OBJET); })
		console.log(`#/02#jpg by size largest\n`);





// ======= image size smallest files
		console.log(`#03#jpg by image size smallest`);
		result = await oracleConnection.execute(`
select id_objet from (
select 
    id_objet,
    imagesize
from (
    select 
      fichiers.id_objet,
      images.largeur_pixel2 * hauteur_pixel2 imagesize
    from fichiers 
    left join images on images.id_fichier = fichiers.id_fichier 
    where 
      fichiers.id_type = 4 and fichiers.signature = '.jpg' 
)
where imagesize is not null
order by imagesize )
where rownum <= 100
`, binds, options);
		result.rows.map(function (row) { console.log(row.ID_OBJET); })
		console.log(`#/03#jpg by image size smallest\n`);

// ======= image size largest files
		console.log(`#04#jpg by image size largest`);
		result = await oracleConnection.execute(`
select id_objet from (
select 
    id_objet,
    imagesize
from (
    select 
      fichiers.id_objet,
      images.largeur_pixel2 * hauteur_pixel2 imagesize
    from fichiers 
    left join images on images.id_fichier = fichiers.id_fichier 
    where 
      fichiers.id_type = 4 and fichiers.signature = '.jpg' 
)
where imagesize is not null
order by imagesize desc)
where rownum <= 100
`, binds, options);
		result.rows.map(function (row) { console.log(row.ID_OBJET); })
		console.log(`#/04#jpg by image size largest\n`);
		
		
		
		
		
// ======= smallest description for files
		console.log(`#05#jpg by exif data smallest`);
		result = await oracleConnection.execute(`
select 
objets.id_objet,

COALESCE(objets_i18n_R.localcaption_i18n, 0) +
COALESCE(Length(objets.sous_titre), 0) +
COALESCE(objets_i18n_R.title_i18n, 0) +
COALESCE(objets_i18n_R.longstring2_i18n, 0) +
COALESCE(Length(iptc.title), 0) +
COALESCE(Length(objets.titre_court), 0) +
COALESCE(objets_i18n_R.memo2_i18n, 0) +
COALESCE(objets_i18n_R.caption_i18n, 0) +
COALESCE(Length(iptc.localcaption), 0) +
COALESCE(Length(iptc.caption), 0) +
COALESCE(Length(objets.legende), 0) +
COALESCE(Length(description.memo2), 0) +
COALESCE(iptc_keywords_R.iptc_keyword, 0) +
COALESCE(Length(iptc.mots_cles), 0) +
COALESCE(iptc_categories_R.iptc_categorie, 0) +
COALESCE(Length(iptc.categorie), 0) +
COALESCE(Length(iptc.autres_cat), 0) +
COALESCE(Length(iptc.observations), 0) +
COALESCE(dbms_lob.getlength(longdesc.longdescblob) , 0) +
COALESCE(Length(iptc.copyright), 0) +
COALESCE(Length(objets.copyright), 0)
    total
    
from objets
left join  ( select
  id_objet,
      sum( COALESCE(length(iptc_keyword),0)) iptc_keyword
      from 
       iptc_keywords 
      group by 
       id_objet 
    ) iptc_keywords_R on objets.id_objet=iptc_keywords_R.id_objet

left join  ( select
  id_objet,
  sum( COALESCE(length(iptc_categorie),0)) iptc_categorie
      
      from 
       iptc_categories 
      group by 
       id_objet 
    ) iptc_categories_R on objets.id_objet=iptc_categories_R.id_objet
left join  ( select
  id_objet,
  sum( COALESCE(length(memo2_i18n),0)) memo2_i18n,
  sum( COALESCE(length(caption_i18n),0)) caption_i18n,
  sum( COALESCE(length(title_i18n),0)) title_i18n,
  sum( COALESCE(length(longstring2_i18n),0)) longstring2_i18n,
  sum( COALESCE(length(localcaption_i18n),0)) localcaption_i18n
       from 
       objets_i18n
      group by 
       id_objet 
    ) objets_i18n_R on objets.id_objet=objets_i18n_R.id_objet
left join iptc on objets.id_objet=iptc.id_objet
left join longdesc on objets.id_objet=longdesc.id_objet
left join description on objets.id_objet=description.id_objet

order by total
`, binds, options);
		result.rows.map(function (row) { console.log(row.ID_OBJET); })
		console.log(`#/05#jpg by exif data smallest\n`);

// ======= largest description for files
		console.log(`#06#jpg by exif data largest`);
		result = await oracleConnection.execute(`
select 
objets.id_objet,

COALESCE(objets_i18n_R.localcaption_i18n, 0) +
COALESCE(Length(objets.sous_titre), 0) +
COALESCE(objets_i18n_R.title_i18n, 0) +
COALESCE(objets_i18n_R.longstring2_i18n, 0) +
COALESCE(Length(iptc.title), 0) +
COALESCE(Length(objets.titre_court), 0) +
COALESCE(objets_i18n_R.memo2_i18n, 0) +
COALESCE(objets_i18n_R.caption_i18n, 0) +
COALESCE(Length(iptc.localcaption), 0) +
COALESCE(Length(iptc.caption), 0) +
COALESCE(Length(objets.legende), 0) +
COALESCE(Length(description.memo2), 0) +
COALESCE(iptc_keywords_R.iptc_keyword, 0) +
COALESCE(Length(iptc.mots_cles), 0) +
COALESCE(iptc_categories_R.iptc_categorie, 0) +
COALESCE(Length(iptc.categorie), 0) +
COALESCE(Length(iptc.autres_cat), 0) +
COALESCE(Length(iptc.observations), 0) +
COALESCE(dbms_lob.getlength(longdesc.longdescblob) , 0) +
COALESCE(Length(iptc.copyright), 0) +
COALESCE(Length(objets.copyright), 0)
    total
    
from objets
left join  ( select
  id_objet,
      sum( COALESCE(length(iptc_keyword),0)) iptc_keyword
      from 
       iptc_keywords 
      group by 
       id_objet 
    ) iptc_keywords_R on objets.id_objet=iptc_keywords_R.id_objet

left join  ( select
  id_objet,
  sum( COALESCE(length(iptc_categorie),0)) iptc_categorie
      
      from 
       iptc_categories 
      group by 
       id_objet 
    ) iptc_categories_R on objets.id_objet=iptc_categories_R.id_objet
left join  ( select
  id_objet,
  sum( COALESCE(length(memo2_i18n),0)) memo2_i18n,
  sum( COALESCE(length(caption_i18n),0)) caption_i18n,
  sum( COALESCE(length(title_i18n),0)) title_i18n,
  sum( COALESCE(length(longstring2_i18n),0)) longstring2_i18n,
  sum( COALESCE(length(localcaption_i18n),0)) localcaption_i18n
       from 
       objets_i18n
      group by 
       id_objet 
    ) objets_i18n_R on objets.id_objet=objets_i18n_R.id_objet
left join iptc on objets.id_objet=iptc.id_objet
left join longdesc on objets.id_objet=longdesc.id_objet
left join description on objets.id_objet=description.id_objet

order by total desc
`, binds, options);
		result.rows.map(function (row) { console.log(row.ID_OBJET); })
		console.log(`#/06#jpg by exif data largest\n`);



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