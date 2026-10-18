import{o as e,t}from"./app-C1yNwNJg.js";e();var n=t();function r({label:e,error:t,helperText:r,className:i=``,id:a,...o}){let s=a||(e?e.toLowerCase().replace(/\s+/g,`-`):void 0);return(0,n.jsxs)(`div`,{className:`w-full`,children:[e&&(0,n.jsx)(`label`,{htmlFor:s,className:`block text-sm font-bold uppercase tracking-wider text-black mb-1.5 font-heading`,children:e}),(0,n.jsx)(`input`,{id:s,className:`
                    w-full px-3.5 py-2.5 bg-white text-black
                    border-2 border-black
                    shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                    focus:outline-none focus:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]
                    transition-all duration-150 font-medium text-sm
                    placeholder:text-neutral-400
                    disabled:bg-neutral-100 disabled:opacity-75 disabled:cursor-not-allowed
                    ${t?`border-rose-500 shadow-[3px_3px_0px_0px_rgba(244,63,94,1)]`:``}
                    ${i}
                `,...o}),t&&(0,n.jsx)(`p`,{className:`mt-1 text-xs font-bold text-rose-600`,children:t}),r&&!t&&(0,n.jsx)(`p`,{className:`mt-1 text-xs text-neutral-600 font-medium`,children:r})]})}function i({label:e,error:t,helperText:r,className:i=``,id:a,...o}){let s=a||(e?e.toLowerCase().replace(/\s+/g,`-`):void 0);return(0,n.jsxs)(`div`,{className:`w-full`,children:[e&&(0,n.jsx)(`label`,{htmlFor:s,className:`block text-sm font-bold uppercase tracking-wider text-black mb-1.5 font-heading`,children:e}),(0,n.jsx)(`textarea`,{id:s,className:`
                    w-full px-3.5 py-2.5 bg-white text-black
                    border-2 border-black
                    shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                    focus:outline-none focus:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]
                    transition-all duration-150 font-medium text-sm
                    placeholder:text-neutral-400
                    disabled:bg-neutral-100 disabled:opacity-75 disabled:cursor-not-allowed
                    ${t?`border-rose-500 shadow-[3px_3px_0px_0px_rgba(244,63,94,1)]`:``}
                    ${i}
                `,...o}),t&&(0,n.jsx)(`p`,{className:`mt-1 text-xs font-bold text-rose-600`,children:t}),r&&!t&&(0,n.jsx)(`p`,{className:`mt-1 text-xs text-neutral-600 font-medium`,children:r})]})}function a({label:e,error:t,helperText:r,className:i=``,options:a,children:o,id:s,...c}){let l=s||(e?e.toLowerCase().replace(/\s+/g,`-`):void 0);return(0,n.jsxs)(`div`,{className:`w-full`,children:[e&&(0,n.jsx)(`label`,{htmlFor:l,className:`block text-sm font-bold uppercase tracking-wider text-black mb-1.5 font-heading`,children:e}),(0,n.jsxs)(`select`,{id:l,className:`
                    w-full px-3.5 py-2.5 bg-white text-black
                    border-2 border-black
                    shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                    focus:outline-none focus:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]
                    transition-all duration-150 font-bold text-sm
                    cursor-pointer
                    ${t?`border-rose-500 shadow-[3px_3px_0px_0px_rgba(244,63,94,1)]`:``}
                    ${i}
                `,...c,children:[a&&a.map(e=>(0,n.jsx)(`option`,{value:e.value,disabled:e.disabled,className:`text-black bg-white py-1`,children:e.label},e.value)),o]}),t&&(0,n.jsx)(`p`,{className:`mt-1 text-xs font-bold text-rose-600`,children:t}),r&&!t&&(0,n.jsx)(`p`,{className:`mt-1 text-xs text-neutral-600 font-medium`,children:r})]})}function o({children:e,variant:t=`yellow`,className:r=``}){return(0,n.jsx)(`span`,{className:`
                inline-flex items-center gap-1 px-2.5 py-0.5
                border-2 border-black
                shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                text-xs font-black uppercase tracking-wider
                ${{yellow:`bg-[#FFDC58] text-black`,purple:`bg-[#A388EE] text-black`,mint:`bg-[#7FBC8C] text-black`,coral:`bg-[#FF6B6B] text-black`,sky:`bg-[#69D2E7] text-black`,pink:`bg-[#FF8FAB] text-black`,orange:`bg-[#FFA94D] text-black`,white:`bg-white text-black`,gray:`bg-neutral-200 text-neutral-800`}[t]}
                ${r}
            `,children:e})}export{i,r as n,a as r,o as t};