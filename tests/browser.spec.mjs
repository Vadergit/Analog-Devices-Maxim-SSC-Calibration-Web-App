import {test,expect} from '@playwright/test';
test('Elmos-style home, guided calibration, verification and archive',async({page})=>{
 page.setDefaultTimeout(5000);const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.message)});
 await page.goto('http://127.0.0.1:8000/');
 await expect(page.locator('#tiles .gw-choice')).toHaveCount(8);
 await expect(page.locator('#nav .gw-sideitem')).toHaveCount(11);
 await page.locator('[data-task="calibration"]').click();
 await page.locator('[data-preset="quick"]').click();
 await page.locator('#next').click();
 await page.locator('#plan').click();
 await page.locator('#next').click();
 await page.locator('#demo').click();
 await expect(page.locator('#pointHeading')).toContainText('Messpunkt');
 await page.locator('#fit').click();
 await expect(page.locator('#gwTitle')).toHaveText('Kalibrierung berechnen');
 await page.locator('#next').click();
 await page.locator('#addCheck').click();
 const fields=page.locator('#checks tr input');
 await fields.nth(0).fill('50');await fields.nth(1).fill('25');await fields.nth(2).fill('0');
 await page.locator('#verify').click();
 await expect(page.locator('#verifyStatus')).toContainText('Host-Prüfung');
 await page.locator('#guidedHomeTop').click();
 await page.locator('[data-task="archive"]').click();
 await page.locator('#saveArchive').click();
 await expect(page.locator('#archiveList')).toContainText('max40109');
 await page.locator('#settingsOpen').click();
 await page.locator('#themeSelect').selectOption('dark');
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 expect(errors).toEqual([]);
});

test('hardware viewer fields, offline guard and RAM controls',async({page})=>{page.setDefaultTimeout(5000);await page.goto('http://127.0.0.1:8000/');await page.locator('#connectionToggle').click();await expect(page.locator('#mtpRead')).toBeVisible();await page.locator('#mtpRead').click();await expect(page.locator('#hwStatus')).toContainText('verbinden');await page.locator('#guidedHomeTop').click();await page.locator('[data-task="nvm"]').click();await expect(page.locator('#applyGain')).toBeVisible();});
test('candidate and ROM controls remain guarded offline',async({page})=>{page.setDefaultTimeout(5000);await page.goto('http://127.0.0.1:8000/');await page.locator('#nav button').nth(9).click();await page.locator('#candidate').click();await expect(page.locator('#candidateResult')).toContainText('MTP');await page.locator('#shadowApply').click();await expect(page.locator('#candidateResult')).toContainText('verbinden');await page.locator('#guidedHomeTop').click();await page.locator('#connectionToggle').click();await page.locator('#readUid').click();await expect(page.locator('#hwStatus')).toContainText('verbinden');});

test('mock USB adapter: probe, RAM, double shadow read, masked RAM write',async({page})=>{
 page.setDefaultTimeout(8000);
 await page.addInitScript(()=>{
  let controller,regs=new Map([[0,0],[4,0],[6,1234],[8,567],[15,4321],[17,890],[2,0x300]]),words=Array(69).fill(0);words[68]=0x4d;
  window.commands=[];
  let port={async open(){this.readable=new ReadableStream({start(c){controller=c}});this.writable=new WritableStream({write(bytes){let cmd=new TextDecoder().decode(bytes).trim();window.commands.push(cmd);let [op,a,m,v]=cmd.split(' '),reply;let adr=parseInt(a,16),hex=(n)=>n.toString(16).toUpperCase().padStart(4,'0');if(op==='HELLO')reply='MAX40109-RO 5';else if(op==='INFO')reply='OK INFO ESP32C3 5 I2C,ROM,RAM,MTP,SHADOW';else if(op==='PROBE')reply='OK PROBE '+a;else if(op==='READ')reply='OK '+a+' '+hex(regs.get(adr)||0);else if(op==='DUMP')reply='OK DUMP '+words.map(hex).join(' ');else if(op==='PATCH'){let next=((regs.get(adr)||0)&~parseInt(m,16))|parseInt(v,16);regs.set(adr,next);reply='OK PATCH '+a+' '+hex(next)}else reply='ERR unknown';let b=new TextEncoder().encode(reply+'\n');controller.enqueue(b.slice(0,4));controller.enqueue(b.slice(4));}})},async close(){}};
  Object.defineProperty(navigator,'serial',{configurable:true,value:{requestPort:async()=>port}});
 });
 await page.goto('http://127.0.0.1:8000/');await page.locator('#connectionToggle').click();
 await page.locator('#adapter').selectOption('bridge');await page.locator('#connect').click();
 await expect(page.locator('#connection')).toHaveText('I²C antwortet');
 await page.locator('#ramRead').click();await expect(page.locator('#ramRows tr')).toHaveCount(23);
 await page.locator('#mtpRead').click();await expect(page.locator('#mtpRows tr')).toHaveCount(69);
 await expect(page.locator('#hwStatus')).toContainText('zweimal identisch');
 await page.locator('#guidedHomeTop').click();await page.locator('[data-task="nvm"]').click();
 page.once('dialog',d=>d.accept());await page.locator('#applyGain').click();
 await expect(page.locator('#afeHwStatus')).toContainText('rückgelesen');
 let commands=await page.evaluate(()=>window.commands);expect(commands.filter(x=>x==='DUMP')).toHaveLength(2);expect(commands).toContain('PATCH 04 003F 0006');
});
test('Pro Micro and external board interlock',async({page})=>{await page.goto('http://127.0.0.1:8000/');await page.locator('#connectionToggle').click();await page.locator('#adapter').selectOption('promicro');await expect(page.locator('#adapterHelp')).toContainText('SDA D2');await page.locator('#targetBoard').selectOption('evkit');await expect(page.locator('#connect')).toBeDisabled();await page.locator('#evkitConfirm').check();await expect(page.locator('#connect')).toBeEnabled();await page.locator('#adapter').selectOption('oem');await expect(page.locator('#connect')).toBeDisabled();await expect(page.locator('#adapterHelp')).toContainText('Hostprotokoll');});
