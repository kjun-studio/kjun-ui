// An ordinary Tailwind-style app: utilities with stock values plus element selectors.
export const appCss = `
.hidden{display:none}
@media (min-width:768px){.md\\:flex{display:flex}}
.flex{display:flex}
.mt-1{margin-top:0.25rem}
.text-lg{font-size:1.125rem;line-height:1.75rem}
.rounded{border-radius:0.25rem}
.app-card{border:2px dashed rgb(255,0,0);padding:12px}
h2{margin:0 0 12px;font-size:20px;font-weight:700}
p{margin:0 0 8px}
ul{list-style:disc;padding-left:20px;margin:0 0 8px}
a{color:rgb(0,0,238);text-decoration:underline}
button{background:rgb(200,200,200);padding:4px 8px;border:1px solid rgb(0,0,0)}
table{border-collapse:separate}
*,::before,::after{--tw-ring-color:rgb(0,0,255)}
.ring-2{box-shadow:0 0 0 2px var(--tw-ring-color)}
`;

export const appHtml = `
<div class="hidden md:flex" data-probe="responsive">menu</div>
<div class="flex mt-1 text-lg rounded" data-probe="utilities">utilities</div>
<div class="ring-2" data-probe="ring">ring</div>
<input class="ds-field" data-probe="ds-field" value="app field">
<label class="ds-choice" data-probe="ds-choice">app choice</label>
<div class="ds-form-group" data-probe="ds-form-group">app group</div>
<button class="ds-dropdown-item" type="button" data-probe="ds-dropdown-item">app item</button>
<section class="app-card" data-probe="card">
  <h2 data-probe="heading">공지</h2>
  <p data-probe="paragraph">본문</p>
  <ul data-probe="list"><li data-probe="item">항목</li></ul>
  <a href="#more" data-probe="link">자세히</a>
  <button type="button" data-probe="button">앱 버튼</button>
  <table data-probe="table"><tbody><tr><td>1</td></tr></tbody></table>
</section>`;

export function installAppCss() {
  if (location.search.includes('noapp')) return;
  const style = document.createElement('style');
  style.textContent = appCss;
  document.head.append(style);
}
