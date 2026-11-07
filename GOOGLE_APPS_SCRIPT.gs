// EVERGREEN 3.2 — Google Drive backup com sincronização entre dispositivos
const EVERGREEN_SECRET = 'COLOQUE_AQUI_O_MESMO_CODIGO_SECRETO_DO_APP';
const BACKUP_FILENAME = 'EVERGREEN_BACKUP.json';
function doGet(e) {
  const p=(e&&e.parameter)||{}, callback=p.callback||'', secret=p.secret||'';
  let result;
  try {
    if(secret!==EVERGREEN_SECRET) throw new Error('Código secreto incorreto');
    const files=DriveApp.getFilesByName(BACKUP_FILENAME);
    if(!files.hasNext()) result={ok:true,data:null};
    else {
      const saved=JSON.parse(files.next().getBlob().getDataAsString('UTF-8'));
      // Retorna envelope 3.2; aceita e migra automaticamente o formato antigo.
      result={ok:true,data:saved&&saved.__evergreenBackup===true?saved:{__legacy:true,data:saved,version:'legacy'}};
    }
  } catch(err){result={ok:false,error:String(err.message||err)}}
  const json=JSON.stringify(result);
  if(!/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  return ContentService.createTextOutput(callback+'('+json+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}
function doPost(e) {
  try {
    const p=JSON.parse((e.postData&&e.postData.contents)||'{}');
    if(p.secret!==EVERGREEN_SECRET||p.action!=='write'||!p.data||!p.version) throw new Error('Solicitação inválida ou código secreto incorreto');
    const envelope={__evergreenBackup:true,version:p.version,deviceId:p.deviceId||'',updatedAt:new Date().toISOString(),data:p.data};
    const files=DriveApp.getFilesByName(BACKUP_FILENAME),content=JSON.stringify(envelope);
    if(files.hasNext()) files.next().setContent(content);
    else DriveApp.createFile(BACKUP_FILENAME,content,MimeType.PLAIN_TEXT);
    return ContentService.createTextOutput(JSON.stringify({ok:true,version:p.version})).setMimeType(ContentService.MimeType.JSON);
  } catch(err){return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(err.message||err)})).setMimeType(ContentService.MimeType.JSON)}
}
