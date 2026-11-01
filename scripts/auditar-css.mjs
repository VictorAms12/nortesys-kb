import {readFileSync,readdirSync} from "node:fs";
import {join,extname} from "node:path";
function parserCss(s){
 const rules=[],stack=[];let mark=0,quote="",comment=false,escape=false;
 for(let i=0;i<s.length;i++){const c=s[i],n=s[i+1];if(comment){if(c==="*"&&n==="/"){comment=false;i++;}continue;}if(quote){if(escape){escape=false;continue;}if(c==="\\"){escape=true;continue;}if(c===quote)quote="";continue;}
 if(c==="/"&&n==="*"){comment=true;i++;continue;}if(c==='"'||c==="'"){quote=c;continue;}
 if(c==="{"){const h=s.slice(mark,i).replace(/\/\*[\s\S]*?\*\//g,"").trim();stack.push({header:h,start:mark,open:i,at:h.startsWith("@"),context:stack.filter(v=>v.at).map(v=>v.header).join("|")});mark=i+1;}
 else if(c==="}"){const p=stack.pop();if(!p)throw Error("Unbalanced CSS");if(!p.at)rules.push({selector:p.header,context:p.context,start:p.start,open:p.open,end:i+1,body:s.slice(p.open+1,i)});mark=i+1;}
 else if(c===";"&&!stack.length)mark=i+1;
 }
 if(stack.length)throw Error("CSS unclosed "+stack.map(x=>x.header).join("/"));return rules;
}
function dividirSeletores(sel){const arr=[];let word="",level=0,quote="";for(const c of sel){if(quote){word+=c;if(c===quote)quote="";continue;}if(c==="'"||c==='"'){quote=c;word+=c;continue;}if(c==="["||c==="(")level++;if(c==="]"||c===")")level--;if(c===","&&level===0){arr.push(word.trim());word="";}else word+=c;}if(word.trim())arr.push(word.trim());return arr;}
const css=readFileSync("src/app/globals.css","utf8"),rules=parserCss(css);
const groups=new Map(),classes=new Map();
for(const r of rules){const k=r.context+"//"+r.selector;groups.set(k,(groups.get(k)??0)+1);for(const m of r.selector.matchAll(/\.([a-z][a-z0-9_-]*)/gi)){classes.set(m[1],(classes.get(m[1])??0)+1);}}
const duplicates=[...groups].filter(([k,v])=>v>1);
function sources(dir){const a=[];for(const n of readdirSync(dir,{withFileTypes:true})){if(n.name==="node_modules"||n.name===".next"||n.name===".git")continue;const p=join(dir,n.name);if(n.isDirectory())a.push(...sources(p));else if([".tsx",".ts",".mjs"].includes(extname(p)))a.push(p);}return a;}
const data=sources("src").concat(sources("scripts"),sources("tests")).map(p=>readFileSync(p,"utf8")).join("\\n");
const unused=[...classes.keys()].filter(k=>!data.includes(k));
console.log(JSON.stringify({rules:rules.length,duplicateSelectors:duplicates.length,duplicateClasses:[...classes].filter(([k,v])=>v>1).map(([k])=>k).sort(),unusedClasses:unused.sort()},null,2));
if(process.argv.includes("--check")&&duplicates.length)process.exitCode=1;
