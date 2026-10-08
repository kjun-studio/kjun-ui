import { cp, readdir, mkdtemp, mkdir, symlink, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { assertCurrentConsumer } from './package-state.mjs';

// The original checkout, snapshots and installed consumer remain untouched.
const root = resolve(import.meta.dirname, '..');
const original = await assertCurrentConsumer(root);
const directory = await mkdtemp(resolve(tmpdir(), 'kjun-token-mutation-'));
const skip = new Set(['node_modules','.git','artifacts','dist','test-results','playwright-report','.next','.vite','.vinext']);
await cp(root, directory, { recursive:true, filter: path => !path.startsWith(root + '/apps/docs/public') && !path.slice(root.length).split('/').some(part => skip.has(part) || part.startsWith('test-results')) });
await mkdir(directory + '/node_modules/@kjun-ui', {recursive:true});
for(const entry of await readdir(root + '/node_modules')) {
  if(entry === '@kjun-ui') continue;
  await symlink(root + '/node_modules/' + entry, directory + '/node_modules/' + entry);
}
for(const name of ['tokens','react','vue2','native'])
  await symlink(directory + '/packages/' + name, directory + '/node_modules/@kjun-ui/' + name);
const change = async (file, edit) => {
  const path = directory + '/packages/tokens/src/definitions/' + file + '.json';
  const data = JSON.parse(await readFile(path,'utf8')); edit(data);
  await writeFile(path,JSON.stringify(data,null,2)+'\n');
};
await change('typography', t => {
  t.body.fontSizePx=16; t.body.lineHeightPx=24;
  t.control.fontSizePx=16; t.control.lineHeightPx=24;
  for (const role of ['controlSmall', 'control', 'controlLarge']) {
    t[role].fontWeight=700; t[role].letterSpacingEm=0.03;
  }
  t.controlLarge.lineHeightPx=28;
  t.label.fontWeight=400;
  t.cardTitle.fontWeight=700; t.cardTitle.letterSpacingEm=0.04;
  t.caption.fontWeight=500; t.caption.letterSpacingEm=0.02; t.caption.lineHeightPx=20;
  t.input.fontWeight=500; t.input.letterSpacingEm=0.015;
});
await change('geometry', g => { g.card.radii.md={$ref:'radius.radius16'}; g.card.padding.md={$ref:'dimension.value20'}; g.card.padding.lg={$ref:'dimension.value40'}; });
await change('geometry', g => {
  g.button.paddingX.md={$ref:'dimension.value20'}; g.button.paddingX.xs={$ref:'dimension.value10'}; g.radius.radius6=8;
  g.card.titleGap={$ref:'dimension.value12'}; g.table.cellPadding.regular.x={$ref:'dimension.value24'};
  g.table.cellPadding.compact.y={$ref:'dimension.value8'}; g.motion.fast=260;
  g.modal.mobileInset={$ref:'dimension.value24'};
  g.native.minimumTouchTarget=60;
  for (const [size, role] of Object.entries({sm:'caption',md:'sectionTitle',lg:'pageTitle'})) {
    g.input[size].fontSize={$ref:`typography.${role}.fontSizePx`};
    g.input[size].lineHeight={$ref:`typography.${role}.lineHeightPx`};
    g.input[size].affixGap={$ref:'dimension.value20'};
  }
  g.modal.widths={sm:420,md:600,lg:760,xl:960};
  g.modal.titleSize={$ref:'typography.pageTitle.fontSizePx'};
  g.modal.titleLineHeight={$ref:'typography.pageTitle.lineHeightPx'};
  g.modal.titleWeight={$ref:'typography.label.fontWeight'};
  g.modal.titleActionGap={$ref:'dimension.value24'};
  g.modal.actionsGap={$ref:'dimension.value20'};
  g.modal.footerGap={$ref:'dimension.value24'};
  g.table.skeletonHeight=28; g.table.actionColumnWidth=60;
  g.motion.control=340;
});
await change('geometry-extensions', ({ extensions:e }) => {
  e.menu.optionFontSize={$ref:'button.fontSizes.md'};
  e.menu.optionLineHeight={$ref:'button.typography.md.lineHeightPx'};
  e.menu.radius={$ref:'radius.radius16'};
  e.navigation.padding={$ref:'dimension.value24'}; e.topNavigation.gap={$ref:'dimension.value20'};
  e.list.padding={$ref:'dimension.value24'}; e.list.gap={$ref:'dimension.value20'};
  e.badge.padding.xs.y={$ref:'dimension.value4'}; e.chip.radius={$ref:'radius.radius16'}; e.chip.paddingX={$ref:'dimension.value12'};
  e.chip.typography={sm:{$ref:'typography.meta'},md:{$ref:'typography.controlLarge'},lg:{$ref:'typography.cardTitle'}};
  e.chip.removeSize=40;
  e.drawer.bottomRadius={$ref:'radius.radius20'}; e.drawer.paddingX={$ref:'dimension.value24'};
  e.toast.gap={$ref:'dimension.value16'}; e.toast.radius={$ref:'radius.radius16'};
  e.toast.minWidth=360; e.toast.maxWidth=480; e.toast.closeSize=64; e.toast.progressHeight=6;
  e.alert.md.paddingX={$ref:'dimension.value20'}; e.alert.radius={$ref:'radius.radius12'};
  e.empty.iconSize=48; e.badge.dotSize=10;
  e.drawer.closeRadius={$ref:'radius.radius16'};
  e.alert.descriptionGap={$ref:'dimension.value12'}; e.alert.closeOffset={$ref:'dimension.value8'};
  e.state.titleSize={$ref:'typography.pageTitle.fontSizePx'};
  e.state.descriptionSize={$ref:'typography.body.fontSizePx'};
});
await change('geometry-kpi', ({ extensions:e }) => {
  e.kpiHero.md.paddingX={$ref:'dimension.value32'}; e.kpiHero.sm.paddingX={$ref:'dimension.value24'};
  e.kpiRow.md.paddingY={$ref:'dimension.value24'};
  e.kpiRow.separatorGap={$ref:'dimension.value12'};
});
await change('shadows', s => { s.shadowScale.contact[0].blurRadius=30; s.shadowScale.ambient[0].blurRadius=32; });
await change('geometry-details', ({ extensions:e }) => {
  e.form.itemGap={$ref:'dimension.value28'};
  e.form.affixItemGap={$ref:'dimension.value12'};
  e.tooltip.paddingX={$ref:'dimension.value20'}; e.tooltip.paddingY={$ref:'dimension.value12'};
  e.pagination.itemSize=52; e.pagination.radius={$ref:'radius.radius12'};
  e.checkbox.radii.sm={$ref:'radius.radius8'};
  e.checkbox.sizes={sm:20,md:24,lg:30};
  e.checkbox.iconSizes={sm:14,md:16,lg:20};
  e.switch.padding={$ref:'dimension.value4'};
  e.switch.widths={sm:40,md:52,lg:64};
  e.switch.heights={sm:24,md:32,lg:36};
  e.pagination.padding={$ref:'dimension.value24'};
  e.financial.pillPaddingX={$ref:'dimension.value12'};
  e.financial.progressGap={$ref:'dimension.value12'};
});
await change('states', s => {
  s.states.opacity.disabled=0.31; s.states.opacity.disabledStrong=0.22;
  s.states.focus.width=4; s.states.focus.offset=5; s.states.focus.choiceOffset=6;
  s.border.controlWidth=3;
});
await change('responsive-motion', r => {
  r.breakpoints.compact=700; r.breakpoints.medium=820; r.breakpoints.actionContent=500;
  r.responsive.kpiHero=680;
  r.motionDistance={modalEnter:40,modalExit:24,popup:12,toast:20};
});
await change('sizing', s => {
  s.iconSizes={compact:13,small:15,default:18,medium:20,large:22,feature:28};
  s.modal.closeSize=40;
  s.table.selectionSize=20; s.table.searchWidth=224;
  const e=s.extensions;
  e.spinner.sizes={xs:14,sm:20,md:28,lg:36,xl:52};
  e.progress.heights={sm:5,md:9,lg:13};
  e.selection.dotSize=10; e.selection.minimumHeight=40;
  e.menu.minimumWidth=180; e.menu.listMaxHeight=180;
  e.floating.maxHeight=360; e.floating.viewportInset={$ref:'dimension.value14'};
  e.floating.anchorGap={$ref:'dimension.value12'}; e.floating.fieldGap={$ref:'dimension.value10'};
  e.tooltip.maxWidth=288; e.tooltip.arrowSize=10; e.drawer.width=440;
  Object.assign(e.financial,{progressHeight:7,progressMinimumWidth:72,progressLabelWidth:38,
    sparklineWidth:96,sparklineHeight:32,priceSkeletonWidth:76,priceSkeletonHeight:20,
    signedSkeletonWidth:60,signedSkeletonHeight:22});
  Object.assign(e.skeleton,{lineHeights:{sm:10,md:18,lg:26},avatarSize:52,cardAvatarSize:44,
    tableLineHeight:17,chartHeight:220,chartBarMaxWidth:44,chartAxisHeight:3,statWidth:92,
    statHeight:44,blockHeight:116,listAvatarSize:38,quoteWidth:96,quoteHeight:20,
    detailWidth:62,formLabelWidth:104,formLabelHeight:15});
  Object.assign(e.chartSkeleton,{height:260,donutThickness:26,donutLabelWidth:84,
    donutLabelHeight:18});
  Object.assign(e.marketTable,{actionSkeletonWidth:36,headerSkeletonHeight:17});
  Object.assign(e.kpiHero,{deltaSkeletonWidth:236,secondarySkeletonWidth:78,descriptionSkeletonWidth:88});
  Object.assign(e.kpiRow,{dotSize:5,labelSkeletonWidth:88,labelSkeletonHeight:15,
    valueSkeletonWidth:88,segmentSkeletonWidth:54,descriptionSkeletonWidth:98});
});
const steps = [
  ['node',['scripts/tokens.mjs']], ['node',['scripts/build.mjs']],
  ['node',['scripts/pack.mjs']], ['node',['scripts/consumers.mjs']],
  ['node',[root+'/node_modules/@playwright/test/cli.js','test','tests/browser/typography.spec.ts','tests/browser/card-review.spec.ts','tests/browser/geometry-tokens.spec.ts','tests/browser/elevation.spec.ts','tests/browser/token-propagation.spec.ts','tests/browser/chip-toast-tokens.spec.ts','tests/browser/size-contracts.spec.ts','--grep','packed typography|all input families|packed card roles|packed geometry roles|packed elevation roles|packed table spacing|packed remaining geometry|packed choice dimensions|packed market typography|packed responsive thresholds|packed modal|packed Chip|packed Toast|packed independent|packed size roles','--reporter=list']],
];
try {
  for(const [command,args] of steps) execFileSync(command,args,{cwd:directory,stdio:'inherit'});
  await writeFile(root+'/artifacts/token-mutation.json',JSON.stringify({passed:true,verifiedAt:new Date().toISOString(),source:original.source,packages:original.manifest,platforms:['react','vue2','native-web'],changes:{sizeRoles:{spinner:[14,20,28,36,52],progress:[5,9,13],iconScale:[13,15,18,20,22,28],drawerWidth:440,modalClose:40,skeletonLine:[10,18,26],skeletonAvatar:52,sparkline:[96,32],menuMaxHeight:180,tooltipMaxWidth:288},independentConnections:{emptyIcon:48,badgeDot:10,tooltipPadding:[20,12],modalWidths:[420,600,760,960],drawerCloseRadius:16,alertDescriptionGap:12,fieldTypography:['caption','sectionTitle','pageTitle'],affixGap:20,tableSkeleton:[60,28],paginationItemSize:52,controlDuration:340},chipTypography:{sm:'meta',md:'controlLarge',lg:'cardTitle'},chipRemoveSize:40,toast:{minWidth:360,maxWidth:480,closeSize:64,progressHeight:6},indirectMenuTypography:true,captionLineHeight:20,breakpoints:{compact:700,medium:820,actionContent:500},kpiHeroThreshold:680,motionDistance:{modalEnter:40,modalExit:24,popup:12,toast:20},body:16,button:16,cardRadius:16,cardPadding:20,cardPaddingLg:40,cardBlur:30,floatingBlur:32,disabledOpacity:0.31,focusWidth:4,controlBorder:3,selectionWeight:700,selectionTrackingEm:0.03,quietWeight:400,emptyTitleWeight:700,minimumTouchTarget:60,checkboxSizes:{sm:20,md:24,lg:30},switchWidths:{sm:40,md:52,lg:64},switchHeights:{sm:24,md:32,lg:36},geometryFamilies:['navigation','list','badge','chip','drawer','card','kpiHero','kpiRow','modal','toast','alert','tableCard','skeleton','form','checkbox','switch','pagination','financial']}},null,2)+'\n');
  await rm(directory,{recursive:true,force:true});
  console.log('Token changes propagated through generated, packed and rendered packages on all three platforms.');
} catch(error) {
  console.error('Mutation verification retained at ' + directory);
  throw error;
}
