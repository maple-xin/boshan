import * as THREE from './vendor/three.module.js';

const $=id=>document.getElementById(id);
const stage=$('scene'),canvas=$('canvas'),portal=$('portal'),enter=$('enter');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const scene=new THREE.Scene();scene.background=new THREE.Color('#e6dfcf');
const camera=new THREE.PerspectiveCamera(32,1,.1,240);
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;}catch(e){$('loading').hidden=true;$('error').hidden=false;throw e;}
const loader=new THREE.TextureLoader(),raycaster=new THREE.Raycaster();
const pointer=new THREE.Vector2(0,0),pointerTarget=new THREE.Vector2(0,0);
let progress=0,target=0,last=performance.now(),ready=false,down=null,touchY=null;
const objects=[],pickable=[],alphaMaps={};
const groups={dajie:new THREE.Group(),memory:new THREE.Group(),xiye:new THREE.Group()};
Object.values(groups).forEach(g=>scene.add(g));
let active='dajie',building='dajie',vine,fruits=[],picked=0;
let hovered=null,sceneChange=0,harvestCardPending=false,started=false,guideTimer;
const seenGuides=new Set();
const craftMeshes=[];
const craftItems=[{"name":"craft-snuff","title":"内画鼻烟壶","copy":"方寸壶内，手绘山河。一笔一笔绘成的内画鼻烟壶，装着博山艺人的耐心与功夫。","width":0.88,"offset":-2.85,"sections":[{"title":"怎样画进壶里","text":"艺人先处理内壁，让颜料能够附着，再把特制钩笔从狭小壶口伸入，贴着内壁反向运笔、勾线、染色。"},{"title":"难在手，也难在心","text":"笔尖只能在有限空间里转动，线条、轻重和位置都要靠细致控制。眼力、手的稳定与绘画功底，缺一不可。"},{"title":"博山的传承","text":"博山是鲁派内画的重要发源地。小壶里的山水、花鸟与人物，是艺人长期练习后亲手绘成的画，不是印上去的图案。"}],"sources":[{"title":"新华社 · 鲁派内画","url":"https://www.xinhuanet.com/shuhua/20260908/72b6f0be602e4a9090f1ffad30525329/c.html"},{"title":"人民网 · 鲁派内画的工艺与传承","url":"https://culture.people.com.cn/n/2014/1219/c172318-26237018.html"}]},{"name":"craft-yellow","title":"鸡油黄琉璃","copy":"像鸡油一样温润凝黄，这是博山名贵琉璃色料“鸡油黄”的名字由来。","width":1.25,"offset":-1.5,"sections":[{"title":"这一抹黄从哪来","text":"鸡油黄的颜色来自琉璃配料与烧制，成色讲究火候和配方，呈现温润如玉的质感。"},{"title":"从炉火到手工","text":"传统料器由匠人挑料、吹制，再用工具塑形。经过退温、打磨和抛光，雕刻作品还要在表面手工刻出纹饰。"},{"title":"工匠的功夫","text":"高温炉前，吹气与塑形必须连贯配合；温度一变，手法也要跟着调整。浮雕的枝叶、花果，又需要耐心细琢。"}],"sources":[{"title":"人民日报 · 琉璃工匠的吹制与雕刻","url":"https://paper.people.com.cn/rmrb/html/2024-04/15/nw.D110000renmrb_20240415_4-06.htm"},{"title":"山东省陶瓷协会 · 传统色料与吹制工艺","url":"https://www.sdtaoxie.com/item/?id=2578"}]},{"name":"craft-liver","title":"鸡肝石琉璃","copy":"褐红底色里，深色纹理像山峦与云影。鸡肝石，是博山另一种珍贵的琉璃色料。","width":1.15,"offset":-0.05,"sections":[{"title":"名字里的“石”","text":"因颜色像鸡肝、纹理像佳石而得名。它是熔制的琉璃色料，并不是从山里直接开采的石头。"},{"title":"传统手工制作","text":"从配料、熔制到控温，匠人反复掌握色相；再手工吹制、塑形，加工成花瓶、笔筒等器物。"},{"title":"值得细看的纹理","text":"深浅相间的纹路在料中形成，呈现不同的走势与层次。凝重的颜色，配上手工器形，是博山文房器物的一种独特气质。"}],"sources":[{"title":"淄博市广播电视台 · 博山琉璃产品","url":"https://www.cbbn.net/folder34/folder131/folder132/folder205/2024-05-31/Qk6uVDJk5QB4xb4b.html"},{"title":"山东省陶瓷协会 · 传统色料与吹制工艺","url":"https://www.sdtaoxie.com/item/?id=2578"}]},{"name":"craft-fish","title":"博山大鱼盘","copy":"白底青花，一尾大鱼占满盘心。博山大鱼盘，把手绘的活泼与生活的愿望留在陶瓷上。","width":2.15,"offset":2,"sections":[{"title":"泥与笔的手艺","text":"传统制陶先练泥、拉坯、修坯；鱼纹再由艺人用青花颜料在盘坯上手工绘成，罩上透明釉入窑烧成。"},{"title":"博山鱼纹的样子","text":"大头、阔尾、饱满的鱼身，笔触简洁有力，线条与块面相互呼应。看似寥寥几笔，画的是熟练后的从容。"},{"title":"家常里的好寓意","text":"鱼盘既是生活器物，也承载着“年年有余”的愿望。亲手落下的笔触，让传统手艺有了鲜活的温度。"}],"sources":[{"title":"淄博市广播电视台 · 博山的陶瓷工艺","url":"https://www.cbbn.net/folder34/folder131/folder132/folder205/2024-06-14/5sTPyb1JXmw7HVz5.html"}]}];
const foodItems=[{"name":"food-shaobing","title":"焦庄烧饼","copy":"薄皮包着肉香，贴炉烤出焦香。焦庄烧饼，是博山街头一口热乎的日常。","width":1.75,"offset":-3.3,"sections":[{"title":"用什么做","text":"面粉、猪肉馅、葱花与芝麻是常见用料，葱香和肉汁一起藏进薄薄的饼皮。"},{"title":"怎么做","text":"和面、饧面后分剂包馅，手工擀压成薄饼，粘芝麻，再贴入炉壁烤熟。薄而不破，靠的是手上的功夫。"},{"title":"尝起来","text":"刚出炉时饼皮焦香酥脆，内馅鲜香，葱香、肉香与芝麻香交织。趁热吃，更能尝出外酥内润的层次。"}],"sources":[{"title":"淄博城市英文网 · 焦庄烧饼与博山菜","url":"https://boftec.zibo.gov.cn/cec/news/detail?newsid=1902"},{"title":"泰安市人社局 · 烧饼制作专项职业能力规范","url":"https://rsj.taian.gov.cn/module/download/downfile.jsp?classid=0&filename=663cf30e591f429aafb574684751a909.pdf"}]},{"name":"food-spring","title":"博山春卷","copy":"蛋皮卷起时令鲜味，炸成金黄，再蘸一口引汤。这是博山春卷的吃法。","width":1.6,"offset":-1.65,"sections":[{"title":"用什么做","text":"外皮用鸡蛋吊成。肉馅常配肉丝、海米、玉兰片与香椿芽；素馅常见鸡蛋、粉丝、韭菜和虾皮。"},{"title":"怎么做","text":"炒好馅料、晾凉，用薄蛋皮卷紧封口，再挂蛋清生粉糊下锅炸透，切成短段上桌。"},{"title":"尝起来","text":"外皮松酥，内馅鲜香，春日香椿的清香尤其有辨识度。配一碗“引汤”蘸着吃，酥香里又添了润滑。"}],"sources":[{"title":"淄博市广播电视台 · 烹饪大师讲博山炸春卷","url":"https://www.cbbn.net/folder34/folder131/folder132/folder191/2021-02-19/rbsDnPUgMeCWBnQI.html"}]},{"name":"food-meat","title":"博山炸肉","copy":"一盘金黄炸肉，是博山宴席和年节餐桌上的熟面孔。酥脆外衣里，是扎实的肉香。","width":1.6,"offset":0,"sections":[{"title":"用什么做","text":"猪肉配酱油、花椒等调味；家常做法常用里脊，裹糊用生粉，部分做法加入鸡蛋。硬炸与软炸各有口感。"},{"title":"怎么做","text":"肉切条或块，先腌入味，再均匀挂糊、分散下锅炸熟；需要更酥脆时，再复炸一次。"},{"title":"尝起来","text":"外层酥香、内里鲜嫩，咸鲜中带着花椒香。火候和挂糊拿捏得当，才能让肉香与脆口相互衬托。"}],"sources":[{"title":"淄博市文旅局 · 博山炸肉的地方风味","url":"https://wh.zibo.gov.cn/art/2017/5/25/art_260_1606440.html"},{"title":"下厨房 · 博山炸肉家常做法","url":"https://m.xiachufang.com/recipe/100033586/"},{"title":"下厨房 · 博山硬炸肉家常做法","url":"https://m.xiachufang.com/recipe/102160687/"}]},{"name":"food-tofu","title":"豆腐箱","copy":"把一块豆腐做成能开盖的小箱子，再藏进鲜馅。博山豆腐箱，巧思就在这一开一合间。","width":1.6,"offset":1.65,"sections":[{"title":"用什么做","text":"传统做法讲究酸浆豆腐；常见馅料有猪肉、海米、木耳与玉兰片，浇汁配番茄、黄瓜等。"},{"title":"怎么做","text":"豆腐切块炸成金黄，留一边相连切出“箱盖”，掏出内瓤、填入炒好的馅，上笼蒸透，最后浇上勾芡的汤汁。"},{"title":"尝起来","text":"外皮有韧劲，内馅嫩而鲜，豆香、肉香与汤汁融在一起。掀开盖子再尝，才见这道菜的细致。"}],"sources":[{"title":"淄博市人民政府 · 博山豆腐箱","url":"https://www.zibo.gov.cn/art/2023/6/19/art_18390_2715202.html"},{"title":"泰安市人社局 · 豆腐箱与酥锅制作规范","url":"https://rsj.taian.gov.cn/module/download/downfile.jsp?classid=0&filename=deb9babc22bf4b6fafcab904f892f2af.pdf"}]},{"name":"food-suguo","title":"酥锅","copy":"一锅荤素，慢慢煨成博山的年味。酥锅的滋味，藏在一夜的火候里。","width":1.8,"offset":3.35,"sections":[{"title":"用什么做","text":"常见五花肉、猪蹄、炸鲅鱼、白菜、海带和藕，用酱油、醋与糖等调味，各家搭配不同。"},{"title":"怎么做","text":"食材改刀后分层装锅，小火长时间煨制，让汤汁和风味慢慢渗入。做好后冷却，博山人常把它当冷菜吃。"},{"title":"尝起来","text":"软酥醇厚，酸甜咸鲜相融，荤香里有蔬菜的清甜。凉吃时汤汁凝成胶冻，更显浓郁；家家做酥锅，家家有自己的味道。"}],"sources":[{"title":"泰安市人社局 · 豆腐箱与酥锅制作规范","url":"https://rsj.taian.gov.cn/module/download/downfile.jsp?classid=0&filename=deb9babc22bf4b6fafcab904f892f2af.pdf"},{"title":"淄博市广播电视台 · 博山酥锅与年俗","url":"https://www.cbbn.net/folder34/folder131/folder133/folder141/2024-02-27/enPa8dqTlPGBUKwK.html"}]}];
const editorial={"statue":{"copy":"博山人熟悉的“颜奶奶”，也是这座孝乡代代讲述的人物。她的故事，与孝妇河一起流传。","sections":[{"title":"颜文姜的传说","text":"相传颜文姜丈夫早逝，她仍留在婆家照顾公婆，日日远行挑水。神仙赠她神鞭，使瓮中清水不竭；后来神鞭被取出，泉水骤涌，她舍身堵住瓮口，护住家人与乡邻。"},{"title":"一城传承的孝文化","text":"后人为纪念她，将泉称为灵泉，河称为孝妇河，并尊她为“颜神”。颜文姜传说承载着博山孝亲敬老、善待他人的文化记忆。"}],"sources":[{"title":"淄博市文旅局 · 颜文姜传说","url":"https://wh.zibo.gov.cn/art/2016/2/29/art_273_569015.html"}],"name":"statue","title":"颜文姜 · 孝乡的故事","category":"山城记忆 · 博山孝文化"},"fruit":{"copy":"博山猕猴桃，就是有点甜。","sections":[{"title":"甜从源泉来","text":"源泉镇位于鲁山北麓、淄河上游。山地小气候、光照与昼夜温差，为这里的猕猴桃积累风味提供了条件。"},{"title":"一颗“碧玉”的滋味","text":"当地代表品种“博山碧玉”，果肉翠绿、细腻多汁，带着清香，甜中有适口的酸。等果子软熟，滋味更柔润。"},{"title":"把秋天带回家","text":"秋日走进源泉的果园，从藤架下亲手摘下一颗果子，尝尝博山山水养出的这一口甜。"}],"sources":[{"title":"淄博市农业农村局 · 博山猕猴桃","url":"https://ny.zibo.gov.cn/art/2019/8/30/art_979_1723571.html"},{"title":"淄博市文旅局 · 源泉碧玉猕猴桃","url":"https://wh.zibo.gov.cn/art/2016/9/12/art_261_1605656.html"}],"name":"fruit","title":"源泉猕猴桃","category":"采摘小记 · 博山源泉"}};
const config={dajie:{title:'逛一逛大街',eyebrow:'一条街，家乡的日常',copy:'穿过蓝绿的牌坊，<br>去看看今天摊上有什么。',action:'走进大街',hint:'点击菜摊与饭桌 · 慢慢挑，慢慢逛',features:['尝尝博山菜 ↗','看看菜摊 ↗']},memory:{title:'山城里的记忆',eyebrow:'孝乡故事，源泉秋果',copy:'听听孝乡的故事，<br>尝尝源泉猕猴桃的甜。',action:'走近藤架',hint:'点击藤架上的三颗果实 · 收进篮子',features:['看看颜文姜 ↗','去摘猕猴桃 ↗']},xiye:{title:'西冶街，慢慢逛',eyebrow:'街坊小店，陶琉光彩',copy:'从熟悉的街口出发，<br>认识陶瓷与琉璃背后的手艺。',action:'走进西冶街',hint:'点点陶琉桌 · 看看器物的近景',features:['看看陶瓷琉璃 ↗','关于这处街口 ↗']}};
const clockState={ready:false,progress:0,target:0,frames:0,camera:[0,0,0]};
window.__boshan=clockState;
const journey={foods:new Set(),crafts:new Set(),stations:new Set(),statue:false,fruit:0};
const modalOpen=()=>!started||$('detail').open||$('notebook').open;
const smooth=t=>t*t*(3-2*t);

function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(stage);resize();

async function texture(name){const tex=await loader.loadAsync(`./assets/${name}.png`);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());const im=tex.image;const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0);alphaMaps[name]={data:ctx.getImageData(0,0,im.width,im.height).data,w:im.width,h:im.height};return tex;}

function plane(name,map,meta,width,x,z,label,kind){
  const h=width*meta.h/meta.w;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,h),new THREE.MeshBasicMaterial({map,transparent:true,alphaTest:.025,depthWrite:false,side:THREE.DoubleSide}));
  mesh.position.set(x-(meta.cx-.5)*width,h*(meta.baseline-.5),z);
  mesh.renderOrder=100+z;mesh.userData={name,label,kind,width,height:h,station:building};groups[building].add(mesh);objects.push(mesh);if(kind)pickable.push(mesh);return mesh;
}

function shadow(x,z,w,y=.10){const c=document.createElement('canvas');c.width=256;c.height=128;const ctx=c.getContext('2d');const g=ctx.createRadialGradient(128,64,3,128,64,100);g.addColorStop(0,'rgba(55,38,21,.27)');g.addColorStop(1,'rgba(55,38,21,0)');ctx.fillStyle=g;ctx.fillRect(0,0,256,128);const tex=new THREE.CanvasTexture(c);const m=new THREE.Mesh(new THREE.PlaneGeometry(w,w*.16),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));m.position.set(x,y,z+.03);m.renderOrder=80+z;groups[building].add(m);}
function backdrop(map){const bg=new THREE.Mesh(new THREE.PlaneGeometry(150,100),new THREE.MeshBasicMaterial({map}));bg.position.set(0,7,-85);bg.renderOrder=-10;groups[building].add(bg);}
function craftTable(tex,metadata,x,z,items=craftItems,width=8,kind='craft-item'){const table=plane('craft-table',tex['craft-table'],metadata['craft-table'],width,x,z);table.position.y-=1.2;const surface=table.position.y+(.5-metadata['craft-table'].anchors.tabletop[1])*table.userData.height;shadow(x,z,width,-1.1);items.forEach((item,i)=>{const m=plane(item.name,tex[item.name],metadata[item.name],item.width,x+item.offset,z+.1+i*.05,item.title+' · 点开看看',kind);m.position.y+=surface;m.userData.item=i;m.userData.rest=m.position.clone();const c=document.createElement('canvas');c.width=128;c.height=32;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(64,16,1,64,16,60);g.addColorStop(0,'rgba(62,34,12,.35)');g.addColorStop(1,'rgba(62,34,12,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,32);const s=new THREE.Mesh(new THREE.PlaneGeometry(item.width*.85,.17),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));s.position.set(x+item.offset,surface+.02,z+.07+i*.05);s.renderOrder=m.renderOrder-.01;groups[building].add(s);m.userData.contact=s;craftMeshes.push(m);});}

async function init(){
  const metadata=await fetch('./assets/elements.json').then(r=>{if(!r.ok)throw Error('Asset metadata unavailable');return r.json();});
  const names=['gate','stall-left','stall-right','street','statue','xiye','vine','fruit','park','xiye-street','craft-table',...craftItems.map(x=>x.name),...foodItems.map(x=>x.name)];const ts=await Promise.all(names.map(texture));const tex=Object.fromEntries(names.map((n,i)=>[n,ts[i]]));
  backdrop(tex.street);
  const gate=plane('gate',tex.gate,metadata.gate,20,0,0,'走进大街','gate');
  plane('stall-left',tex['stall-left'],metadata['stall-left'],9,-8.8,4,'看看这边的菜摊','left');
  plane('stall-right',tex['stall-right'],metadata['stall-right'],7.2,8.8,2,'看看这边的菜摊','right');
  plane('stall-left',tex['stall-left'],metadata['stall-left'],6.5,-5.7,-25,'看看这边的菜摊','left');
  plane('stall-right',tex['stall-right'],metadata['stall-right'],5.8,5.7,-28,'看看这边的菜摊','right');
  shadow(-8.8,4,9);shadow(8.8,2,7.2);shadow(-5.7,-25,6.5);shadow(5.7,-28,5.8);
  const passage=new THREE.Mesh(new THREE.PlaneGeometry(6.2,5.2),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));passage.position.set(0,2.7,.02);passage.userData={name:'passage',kind:'gate',label:'走进大街',station:'dajie'};groups.dajie.add(passage);pickable.push(passage);
  craftTable(tex,metadata,0,-23,foodItems,8.5,'food-item');
  building='memory';backdrop(tex.park);
  plane('statue',tex.statue,metadata.statue,7.5,-6,-2,'看看颜文姜雕像','statue');shadow(-6,-2,8);
  vine=plane('vine',tex.vine,metadata.vine,12,6,1,'走近藤架摘果子','vine');shadow(6,1,12);
  // Normalized anchors measured against the cropped trellis: hanging leaves and basket mouth.
  const anchors=[[.48,.36],[.62,.34],[.74,.39]];
  fruits=anchors.map((uv,i)=>{const m=plane('fruit',tex.fruit,metadata.fruit,.88,0,1.3,'摘一颗猕猴桃','fruit');m.position.copy(vineAnchor(...uv));m.userData.id=i;m.userData.home=m.position.clone();m.rotation.z=(i-1)*.18;const landed=plane('fruit',tex.fruit,metadata.fruit,.6,0,1.2);landed.position.copy(vineAnchor(.79+i*.038,.815-(i%2)*.015));landed.position.z=1.2;landed.visible=false;landed.rotation.z=i*.4;m.userData.landed=landed;return m;});
  building='xiye';backdrop(tex['xiye-street']);
  plane('xiye',tex.xiye,metadata.xiye,23,0,0,'走进西冶街','gate');
  craftTable(tex,metadata,-5.5,4);
  craftTable(tex,metadata,-4,-23);
  const xp=passage.clone();xp.material=passage.material.clone();xp.position.set(0,2.7,.02);xp.userData={name:'passage',kind:'gate',label:'走进西冶街',station:'xiye'};groups.xiye.add(xp);pickable.push(xp);
  ready=true;clockState.ready=true;clockState.assets=metadata;clockState.gate=gate;clockState.getProjected=name=>{const m=objects.find(x=>x.userData.station===active&&(x.userData.name===name||`fruit-${x.userData.id}`===name)&&x.visible&&!x.userData.picked&&x.position.z<camera.position.z);if(!m)return null;const p=m.position.clone().project(camera);return{x:(p.x+1)/2*stage.clientWidth,y:(1-p.y)/2*stage.clientHeight};};
  switchScene('dajie');
  $('loading').hidden=true;requestAnimationFrame(frame);
}

function applyCamera(){
  const p=smooth(progress),mobile=camera.aspect<1;
  const garden=active==='memory';
  const initialZ=mobile?(garden?68:54):30;
  const gardenX=garden?(mobile?THREE.MathUtils.lerp(1.5,6.5,p):p*4.5):(active==='xiye'?-4*p:0);
  camera.position.set(gardenX+pointer.x*(1-p*.4)*.75,THREE.MathUtils.lerp(5.8,garden?5.3:3.5,p)+pointer.y*.22,THREE.MathUtils.lerp(initialZ,garden?(mobile?42:24):-8,p));
  camera.fov=THREE.MathUtils.lerp(32,garden?32:(mobile?49:38),p);camera.updateProjectionMatrix();camera.lookAt(gardenX+pointer.x*.13,THREE.MathUtils.lerp(5.8,garden?5.3:3.5,p),-85);
  const gate=objects.find(m=>m.userData.station===active&&m.userData.kind==='gate');const distance=camera.position.z;
  if(gate){gate.material.opacity=THREE.MathUtils.clamp((distance+1)/6,0,1);gate.visible=distance>-.5;}
  const anchor=new THREE.Vector3(garden?6:0,garden?4.5:3.4,0).project(camera);
  portal.style.left=`${(anchor.x+1)/2*stage.clientWidth}px`;portal.style.top=`${(1-anchor.y)/2*stage.clientHeight}px`;portal.hidden=progress>.42;
  $('progress').style.width=`${progress*100}%`;
  const inside=progress>.72;$('return').hidden=progress<.03;
  $('chapter').textContent=garden?'02 / 山城与秋果':active==='xiye'?(inside?'03 / 陶琉小店':'03 / 西冶街口 · 旧照片参考'):(inside?'01 / 菜市场':'01 / 大街街口');
  enter.innerHTML=target>.5?'回到起点 <span>←</span>':`${config[active].action} <span>→</span>`;
  $('hint').textContent=inside||garden?config[active].hint:'移动鼠标看层次 · 点击门洞走进去';
  clockState.station=active;clockState.picked=picked;
  $('craft-choices').hidden=active!=='xiye';$('food-choices').hidden=active!=='dajie';
  if(active==='dajie'&&inside)$('hint').textContent='悬停轻轻端起 · 点一盘，拿近看看';
  if(active==='xiye'&&inside)$('hint').textContent='悬停器物轻轻抬起 · 点一件，近看看';
  clockState.progress=progress;clockState.target=target;clockState.camera=camera.position.toArray();clockState.frames++;
}

function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;const a=1-Math.exp(-4.5*dt);progress=reduced?target:THREE.MathUtils.lerp(progress,target,a);if(Math.abs(progress-target)<.0001)progress=target;pointer.lerp(pointerTarget,reduced?1:1-Math.exp(-5*dt));animateFruit(now);animateCraft(dt);applyCamera();renderer.render(scene,camera);requestAnimationFrame(frame);}
function go(value){if(!ready||!started)return;hideGuide();target=THREE.MathUtils.clamp(value,0,1);hovered=null;$('tooltip').hidden=true;}
portal.addEventListener('click',()=>go(1));enter.addEventListener('click',()=>go(target>.5?0:1));$('return').addEventListener('click',()=>go(0));
function location(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top,w:r.width,h:r.height};}
function hit(e){if(!ready)return null;const l=location(e);raycaster.setFromCamera(new THREE.Vector2(l.x/l.w*2-1,-l.y/l.h*2+1),camera);for(const h of raycaster.intersectObjects(pickable)){const m=h.object;if(m.userData.station!==active||m.userData.picked)continue;if(m.userData.kind==='gate'&&progress>.45)continue;if(m.userData.name==='passage')return m;if(m.material.opacity<.2||!m.visible)continue;const a=alphaMaps[m.userData.name];const x=Math.max(0,Math.min(a.w-1,Math.floor(h.uv.x*a.w))),y=Math.max(0,Math.min(a.h-1,Math.floor((1-h.uv.y)*a.h)));if(a.data[(y*a.w+x)*4+3]>110)return m;}return null;}
canvas.addEventListener('pointermove',e=>{const l=location(e);pointerTarget.set(l.x/l.w*2-1,-(l.y/l.h*2-1));if(e.pointerType==='touch')return;const m=hit(e);hovered=['craft-item','food-item'].includes(m?.userData.kind)?m:null;canvas.style.cursor=m?'pointer':'default';$('tooltip').hidden=!m;if(m){$('tooltip').textContent=m.userData.label;$('tooltip').style.left=`${Math.min(l.x+18,l.w-155)}px`;$('tooltip').style.top=`${Math.max(50,l.y-34)}px`;}});
canvas.addEventListener('pointerleave',()=>{hovered=null;pointerTarget.set(0,0);$('tooltip').hidden=true;});
canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};if(e.pointerType==='touch'){touchY=e.clientY;canvas.setPointerCapture(e.pointerId);}});
canvas.addEventListener('pointermove',e=>{if(e.pointerType==='touch'&&touchY!==null){go(target+(touchY-e.clientY)/stage.clientHeight);touchY=e.clientY;}});
canvas.addEventListener('pointerup',e=>{touchY=null;if(!down)return;const d=Math.hypot(e.clientX-down.x,e.clientY-down.y);down=null;if(d>9)return;const m=hit(e);if(!m)return;if(m.userData.kind==='gate'||m.userData.kind==='vine')go(1);else if(m.userData.kind==='fruit')pickFruit(m);else if(m.userData.kind==='craft-item')showCraft(m.userData.item);else if(m.userData.kind==='food-item')showFood(m.userData.item);else showDetail(m.userData.kind);});
canvas.addEventListener('pointercancel',()=>{down=null;touchY=null;});
stage.addEventListener('wheel',e=>{if(!ready||modalOpen())return;const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?stage.clientHeight:1);if((target<=0&&delta<0)||(target>=1&&delta>0))return;e.preventDefault();go(target+delta*.0012);},{passive:false});
document.addEventListener('keydown',e=>{if(modalOpen()||!ready)return;if(e.key==='ArrowDown'){e.preventDefault();go(target+.16);}if(e.key==='ArrowUp'){e.preventDefault();go(target-.16);}if(e.key==='Escape')go(0);});
function setEditorial(item){
  $('detail-text').textContent=item.copy||'';$('detail-facts').replaceChildren();
  for(const part of item.sections||[]){const section=document.createElement('section'),h=document.createElement('h3'),p=document.createElement('p');h.textContent=part.title;p.textContent=part.text;section.append(h,p);$('detail-facts').append(section);}
  $('detail-sources').hidden=!item.sources?.length;$('source-links').replaceChildren();$('detail-sources').open=false;
  for(const source of item.sources||[]){const a=document.createElement('a');a.href=source.url;a.textContent=source.title+' ↗';a.target='_blank';a.rel='noopener noreferrer';$('source-links').append(a);}
}
const details={left:['stall-left','大街，日常的烟火。','大街的菜摊和小店，装着博山人的日常。时令蔬菜摆满筐，买菜、问价、顺手带点熟食，老街的热闹就在这些平常事里。','大街 · 街坊市集'],right:['stall-right','一篮新鲜，一街人情。','沿着大街慢慢逛，看菜摊上应季的颜色，也听听街坊熟悉的招呼。这里有一座山城最朴实的生活气息。','大街 · 街坊市集'],xiye:['xiye','西冶街 · 逛街与识手艺','逛完街市，再认识博山的陶瓷与琉璃。内画的一笔一画、琉璃的手工吹制、鱼盘上的青花笔触，都是理解这座山城的另一扇窗。','西冶街 · 陶琉手艺']};
function showDetail(kind){
 hideGuide();
 if(kind==='craft'){showCraft(0);return;}if(kind==='food'){showFood(0);return;}
 const d=details[kind],item=editorial[kind];if(!d&&!item)return;
 if(kind==='statue'){journey.statue=true;updateJourney();}
 hovered=null;$('continue').textContent=kind==='fruit'?'收好这一口甜，继续逛 →':'继续逛 →';
 $('craft-options').hidden=true;$('food-options').hidden=true;$('detail').classList.remove('craft-detail','food-detail');$('detail').classList.add('story-detail');
 $('detail').classList.toggle('harvest-detail',kind==='fruit');$('detail-img').src=`./assets/${item?.name||d[0]}.png`;$('detail-img').alt=item?.title||d[1];$('detail-title').textContent=item?.title||d[1];$('detail-category').textContent=item?.category||d[3];
 setEditorial(item||{copy:d[2]});$('detail-img').parentElement.classList.remove('food-focus');if(!$('detail').open)$('detail').showModal();$('detail').scrollTop=0;$('detail').querySelector('.detail-copy').scrollTop=0;$('tooltip').hidden=true;
}
function showFood(index){if(!ready)return;hideGuide();const item=foodItems[index];$('detail').classList.remove('story-detail','harvest-detail');journey.foods.add(index);updateJourney();hovered=null;$('tooltip').hidden=true;$('continue').textContent='放回桌上，继续逛 →';$('detail').classList.add('craft-detail','food-detail');const holder=$('detail-img').parentElement;holder.classList.remove('food-focus');$('detail-img').src=`./assets/${item.name}.png`;$('detail-img').alt=item.title;$('detail-title').textContent=item.title;setEditorial(item);$('detail-category').textContent=`大街 · 博山菜 ${index+1} / ${foodItems.length}`;$('craft-options').hidden=true;$('food-options').hidden=false;for(const b of $('food-options').children)b.setAttribute('aria-pressed',String(Number(b.dataset.item)===index));if(!$('detail').open)$('detail').showModal();if(!reduced)$('detail-img').animate([{opacity:0,transform:'translateY(24px) scale(.84)'},{opacity:1,transform:'none'}],{duration:320,easing:'cubic-bezier(.2,.7,.3,1)'});$('detail').scrollTop=0;$('detail').querySelector('.detail-copy').scrollTop=0;clockState.selectedFood=index;}
foodItems.forEach((item,i)=>{for(const id of ['food-choices','food-options']){const b=document.createElement('button');b.textContent=item.title;b.dataset.item=i;if(id==='food-options')b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>showFood(i));$(id).append(b);}});
function showCraft(index){if(!ready)return;hideGuide();const item=craftItems[index];$('detail').classList.remove('story-detail','harvest-detail');journey.crafts.add(index);updateJourney();$('continue').textContent='放回去，继续逛 →';hovered=null;$('tooltip').hidden=true;$('detail').classList.remove('food-detail');$('detail').classList.add('craft-detail');$('detail-img').parentElement.classList.remove('food-focus');$('detail-img').src=`./assets/${item.name}.png`;$('detail-img').alt=item.title;$('detail-title').textContent=item.title;setEditorial(item);$('detail-category').textContent=`西冶街 · 陶瓷琉璃 ${index+1} / ${craftItems.length}`;$('food-options').hidden=true;$('craft-options').hidden=false;for(const b of $('craft-options').children)b.setAttribute('aria-pressed',String(Number(b.dataset.item)===index));if(!$('detail').open)$('detail').showModal();if(!reduced)$('detail-img').animate([{opacity:0,transform:'translateY(14px) scale(.88)'},{opacity:1,transform:'none'}],{duration:280,easing:'cubic-bezier(.2,.7,.3,1)'});$('detail').scrollTop=0;$('detail').querySelector('.detail-copy').scrollTop=0;clockState.selectedCraft=item.name;}
craftItems.forEach((item,i)=>{for(const id of ['craft-choices','craft-options']){const b=document.createElement('button');b.textContent=item.title;b.dataset.item=i;if(id==='craft-options')b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>showCraft(i));$(id).append(b);}});
function animateCraft(dt){const a=reduced?1:1-Math.exp(-10*dt);for(const m of craftMeshes){const lift=(!reduced&&active===m.userData.station&&m===hovered&&!modalOpen()) ? .28 : 0;m.position.y=THREE.MathUtils.lerp(m.position.y,m.userData.rest.y+lift,a);m.position.z=THREE.MathUtils.lerp(m.position.z,m.userData.rest.z+(m.userData.kind==='food-item'&&lift>0?.4:0),a);const s=THREE.MathUtils.lerp(m.scale.x,1+(lift>0 ? .045 : 0),a);m.scale.setScalar(s);m.userData.contact.material.opacity=THREE.MathUtils.lerp(m.userData.contact.material.opacity,lift>0 ? .6 : 1,a);}clockState.hoveredCraft=hovered?.userData.name||null;clockState.craftLift=craftMeshes.filter(m=>m.userData.kind==='craft-item').map(m=>({name:m.userData.name,z:m.position.z,lift:m.position.y-m.userData.rest.y}));clockState.foodLift=craftMeshes.filter(m=>m.userData.kind==='food-item').map(m=>({name:m.userData.name,lift:m.position.y-m.userData.rest.y,forward:m.position.z-m.userData.rest.z}));}
function switchScene(name){if(!ready||!config[name])return;active=name;hideGuide();journey.stations.add(name);updateJourney();target=progress=0;pointer.set(0,0);pointerTarget.set(0,0);$('detail').close();$('notebook').close();$('tooltip').hidden=true;for(const [k,g] of Object.entries(groups))g.visible=k===name;const c=config[name];$('scene-title').textContent=c.title;$('eyebrow').textContent=c.eyebrow;$('intro-copy').innerHTML=c.copy;portal.querySelector('span').innerHTML=`${c.action} <b>↗</b>`;portal.setAttribute('aria-label',c.action);stage.setAttribute('aria-label',`${c.title}图片构成的三维场景`);canvas.setAttribute('aria-label',`${c.title}，移动查看层次，点击物件互动`);$('feature-one').textContent=c.features[0];$('feature-two').textContent=c.features[1];$('harvest').hidden=name!=='memory';for(const b of document.querySelectorAll('[data-scene]'))b.setAttribute('aria-pressed',String(b.dataset.scene===name));applyCamera();renderer.render(scene,camera);if(started)showGuide();}
function requestScene(name){if(!ready)return;const ticket=++sceneChange;hovered=null;$('tooltip').hidden=true;if(reduced){switchScene(name);return;}$('scene-curtain').classList.add('covered');setTimeout(()=>{if(ticket!==sceneChange)return;switchScene(name);requestAnimationFrame(()=>requestAnimationFrame(()=>$('scene-curtain').classList.remove('covered')));},180);}
for(const b of document.querySelectorAll('[data-scene]'))b.addEventListener('click',()=>requestScene(b.dataset.scene));
$('feature-one').addEventListener('click',()=>{if(ready)showDetail(active==='dajie'?'food':active==='memory'?'statue':'craft');});
$('feature-two').addEventListener('click',()=>{if(!ready)return;if(active==='memory')go(1);else showDetail(active==='dajie'?'left':'xiye');});
function vineAnchor(u,v){return new THREE.Vector3(vine.position.x+(u-.5)*vine.userData.width,vine.position.y+(.5-v)*vine.userData.height,1.35);}
function pickFruit(m){if(m.userData.picked)return;hideGuide();m.userData.picked=true;m.userData.start=performance.now();m.userData.end=vineAnchor(.81,.80);m.userData.end.x+=(picked-1)*.23;picked++;if(picked===3)harvestCardPending=true;journey.fruit=Math.max(journey.fruit,picked);updateJourney();$('harvest-count').textContent=`篮子里 ${picked} / 3 颗`;$('reset-fruit').hidden=picked<3;$('pick-next').hidden=picked===3;$('harvest-intro').hidden=picked<3;$('tooltip').hidden=true;}
function animateFruit(now){for(const m of fruits){if(!m.userData.picked)continue;const t=reduced?1:Math.min(1,(now-m.userData.start)/850);m.position.lerpVectors(m.userData.home,m.userData.end,smooth(t));m.position.y+=Math.sin(t*Math.PI)*1.2;m.rotation.z=t*1.5;m.scale.setScalar(1-.35*t);m.material.opacity=t>.9?(1-t)*10:1;if(t===1){m.visible=false;m.userData.landed.visible=true;}}if(harvestCardPending&&picked===3&&fruits.every(m=>!m.visible)&&active==='memory'&&!modalOpen()){harvestCardPending=false;showDetail('fruit');}}
$('reset-fruit').addEventListener('click',()=>{picked=0;harvestCardPending=false;$('harvest-intro').hidden=true;for(const m of fruits){m.userData.picked=false;m.userData.landed.visible=false;m.visible=true;m.position.copy(m.userData.home);m.scale.setScalar(1);m.material.opacity=1;m.rotation.z=(m.userData.id-1)*.18;}$('harvest-count').textContent='篮子里 0 / 3 颗';$('reset-fruit').hidden=true;$('pick-next').hidden=false;});
$('pick-next').addEventListener('click',()=>{const m=fruits.find(f=>!f.userData.picked);if(m)pickFruit(m);});
for(const id of ['close-detail','continue'])$(id).addEventListener('click',()=>$('detail').close());
$('detail').addEventListener('click',e=>{if(e.target===$('detail')){const r=$('detail').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('detail').close();}});
window.__boshan.seek=p=>{target=progress=THREE.MathUtils.clamp(p,0,1);if(ready){applyCamera();renderer.render(scene,camera);}};
init().catch(e=>{console.error(e);$('loading').hidden=true;$('error').hidden=false;portal.hidden=true;enter.disabled=true;clockState.error=e.message;});

function updateJourney(){
  const messages={dajie:journey.foods.size?`端近看了 ${journey.foods.size} 道博山菜，下一站去看看山城。`:'挑一道家乡菜看看，也可以先去下一站。',memory:`${journey.statue?'看过颜文姜，':'这里有熟悉的雕像，'}${journey.fruit?`摘了 ${journey.fruit} 颗秋果。`:'藤架上的果子，等你摘。'}`,xiye:journey.crafts.size?`看过 ${journey.crafts.size} 件陶琉，把喜欢的留在小记里。`:'一件一件看看，逛过的都会记在小记里。'};
  $('journey-status').textContent=messages[active];
  $('next-station').textContent={dajie:'去看看山城 →',memory:'去西冶街逛逛 →',xiye:'收好这次游逛 ↗'}[active];
  clockState.journey={foods:[...journey.foods],crafts:[...journey.crafts],stations:[...journey.stations],statue:journey.statue,fruit:journey.fruit};
}
function showNotebook(){
  if(!ready)return;hideGuide();hovered=null;$('tooltip').hidden=true;$('detail').close();
  const pages=$('notebook-pages');pages.replaceChildren();
  const section=(title,items,empty)=>{const block=document.createElement('section'),h=document.createElement('h3');h.textContent=title;block.append(h);if(!items.length){const p=document.createElement('p');p.className='notebook-empty';p.textContent=empty;block.append(p);}else{const list=document.createElement('div');list.className='notebook-items';for(const item of items){const figure=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption');img.src=`./assets/${item.name}.png`;img.alt=item.title;caption.textContent=item.title;figure.append(img,caption);list.append(figure);}block.append(list);}pages.append(block);};
  section('大街 · 看过的家乡菜',foodItems.filter((_,i)=>journey.foods.has(i)),'还没端近看过菜，下次去桌边挑一盘。');
  const memories=[];if(journey.statue)memories.push({name:'statue',title:'颜文姜'});if(journey.fruit)memories.push({name:'fruit',title:`摘了 ${journey.fruit} 颗猕猴桃`});
  section('山城 · 熟悉的身影与秋果',memories,'还没看过雕像、摘过秋果，山城里等你来。');
  section('西冶街 · 看过的陶琉',craftItems.filter((_,i)=>journey.crafts.has(i)),'还没拿近看过器物，去找找喜欢的颜色。');
  if(!$('notebook').open)$('notebook').showModal();$('notebook').scrollTop=0;
}
$('next-station').addEventListener('click',()=>{if(active==='xiye')showNotebook();else requestScene(active==='dajie'?'memory':'xiye');});
$('open-notebook').addEventListener('click',showNotebook);
for(const id of ['close-notebook','back-to-scene'])$(id).addEventListener('click',()=>$('notebook').close());
$('notebook').addEventListener('click',e=>{if(e.target===$('notebook')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});

$('harvest-intro').addEventListener('click',()=>showDetail('fruit'));

function hideGuide(){clearTimeout(guideTimer);$('scene-guide').classList.remove('guide-visible');$('scene-guide').hidden=true;}
function showGuide(replay=false){
 if(!ready||!started||modalOpen()||(!replay&&seenGuides.has(active)))return;
 clearTimeout(guideTimer);seenGuides.add(active);
 $('guide-text').textContent={dajie:'点牌坊往里走，再点菜看介绍。也可以用下方的菜名挑一盘。',memory:'点雕像听孝乡故事，点藤架上的果子采摘。摘满三颗，就能读到源泉的秋甜。',xiye:'点器物识手艺，拿近看一笔一画。逛完后，翻翻你的博山游逛小记。'}[active];
 $('scene-guide').hidden=false;$('scene-guide').classList.add('guide-visible');
 guideTimer=setTimeout(()=>{$('scene-guide').classList.remove('guide-visible');guideTimer=setTimeout(()=>{$('scene-guide').hidden=true;},reduced?0:450);},9000);
 clockState.guideStation=active;
}
$('cover-start').addEventListener('click',()=>{
 if(started)return;started=true;clockState.started=true;
 document.querySelector('header').inert=false;document.querySelector('main').inert=false;document.body.classList.remove('cover-open');
 $('cover').hidden=true;window.scrollTo({top:0,behavior:'instant'});document.querySelector('[data-scene="dajie"]').focus({preventScroll:true});if(ready)showGuide();
});
$('close-guide').addEventListener('click',hideGuide);
$('help-guide').addEventListener('click',()=>showGuide(true));
