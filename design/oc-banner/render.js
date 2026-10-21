// node render.js → ../../assets/tochibi/oc/oc-banner-pc.(webp|jpg), oc-banner-sp.*
const pc=require('/Users/ohsugachiaki/Projects/cobble-static/node_modules/puppeteer-core');
const path=require('path');
(async()=>{
  const b=await pc.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--allow-file-access-from-files']});
  for(const [v,w,h] of [['pc',1600,860],['sp',1100,1430]]){
    const p=await b.newPage(); await p.setViewport({width:w,height:h});
    await p.goto('file://'+path.resolve('banner.html')+(v==='sp'?'?sp':''),{waitUntil:'networkidle0'});
    await p.evaluate(()=>document.fonts.ready);
    await p.screenshot({path:`out-${v}.png`});
    await p.screenshot({path:`../../assets/tochibi/oc/oc-banner-${v}.webp`,type:'webp',quality:82});
  }
  // OGP 1200x630
  const o=await b.newPage(); await o.setViewport({width:1600,height:860,deviceScaleFactor:.75});
  await o.goto('file://'+path.resolve('banner.html'),{waitUntil:'networkidle0'}); await o.evaluate(()=>document.fonts.ready);
  await o.screenshot({path:'../../assets/tochibi/oc/oc-banner-ogp.jpg',type:'jpeg',quality:85,clip:{x:0,y:10,width:1600,height:840}});
  await b.close();
})();
