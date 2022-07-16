const fs = require('fs');
const path = require('path');
const {PDFNet} = require('@pdftron/pdfnet-node');
const moment = require('moment-timezone');

module.exports = {
  updatePDF: async (req, res) => {
    if(typeof req.file('file') !== 'undefined') {
      let file = req.file('file');
      file.upload({dirname: path.normalize(__dirname + '../../../assets/pdf'), saveAs: (fileStream, callback) => {
        callback(null, fileStream.filename);
      }},(err, uploadedFiles) => {
        if (err) {
          return res.status(500).json(err);
        } else {
          let filePath = uploadedFiles[0].fd;
          let outputPath = path.normalize(__dirname + '../../../assets/pdf/modified/' + uploadedFiles[0].filename)
          let isDateFound = false;
          if(!fs.existsSync(path.normalize(__dirname + '../../../assets/pdf/modified/'))){
            fs.mkdirSync(path.normalize(__dirname + '../../../assets/pdf/modified/'));
          }

          const searchAndReplace = async () => {
            const pdfdoc = await PDFNet.PDFDoc.createFromFilePath(filePath);
            await pdfdoc.initSecurityHandler();
            const txtSearch = await PDFNet.TextSearch.create();
            let mode = PDFNet.TextSearch.Mode.e_reg_expression + PDFNet.TextSearch.Mode.e_page_stop
            let pattern = "\\w+ \\d{1,2}\\w{2}, \\d{4}";

            txtSearch.begin(pdfdoc, pattern, mode);

            while(true){
              const result = await txtSearch.run();
              if(result.code === PDFNet.TextSearch.ResultCode.e_found){
                isDateFound = true;
                let newDate = moment(result.out_str, 'MMMM Do, YYYY').add(2, 'days').format('MMMM Do, YYYY');
                const replacer = await PDFNet.ContentReplacer.create();
                const page = await pdfdoc.getPage((result.page_num));
                if(result.out_str.split("").filter((v) => v === result.out_str.substring(result.out_str.length - 1)).length > 1){
                  let arr = result.out_str.split(" ");
                  let arr2 = newDate.split(" ");
                  for (let i = 0; i < arr.length; i++) {
                      let string1 = arr[i].trim();
                      let string2 = arr2[i].trim();


                      let matchStringStart = string1.substring(0, 1);
                      let matchStringEnd = string1.substring(string1.length - 1);
                      let replaceString = string1.substring(1, string1.length - 1);
                      await replacer.setMatchStrings(matchStringStart, matchStringEnd);
                      await replacer.addString(replaceString, string2);
                      await replacer.process(page);
                  }
                } else {
                  let matchStringStart = result.out_str.substring(0, 1);
                  let matchStringEnd = result.out_str.substring(result.out_str.length - 1);
                  let replaceString = result.out_str.substring(1, result.out_str.length - 1);
                  await replacer.setMatchStrings(matchStringStart, matchStringEnd);
                  await replacer.addString(replaceString, newDate);
                  await replacer.process(page);
                }
                await pdfdoc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);
              } else if(result.code === PDFNet.TextSearch.ResultCode.e_page){
                console.log("\n Page End");
                break;
              } else if (result.code === PDFNet.TextSearch.ResultCode.e_done) {
                console.log("\n Search End");
                break;
              }
            }
          }

          PDFNet.runWithCleanup(searchAndReplace, 'demo:ashok.bhati@techivies.com:7a5e26e902000000001cffaa18934dadab5877453ef7b008928bef5d27').then(async () => {
            await PDFNet.shutdown();
            if(isDateFound){
              return res.ok({filePath: outputPath});
            } else {
              res.status(400).json("no date found with format: MMMM Do, YYYY");
            }
          }).catch((err) => {
            return res.status(500).json(err);
          });
        }
      });
    } else {
      res.status(404).json({error:'file not found'});
    }
  }
}
