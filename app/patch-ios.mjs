// Run inside app/ after `npx cap add ios`: sets the version and the few Info.plist keys the App Store asks for.
import fs from 'node:fs';

const proj = 'ios/App/App.xcodeproj/project.pbxproj';
const plist = 'ios/App/App/Info.plist';
for (const f of [proj, plist]) if (!fs.existsSync(f)) throw new Error('Could not find ' + f);

const build = process.env.BUILD_NUMBER || '1', name = process.env.VERSION_NAME || '1.0.0';

// ---- version: MARKETING_VERSION is what people see, CURRENT_PROJECT_VERSION must go up with every upload ----
let p = fs.readFileSync(proj, 'utf8');
if (!/MARKETING_VERSION = [^;]+;/.test(p) || !/CURRENT_PROJECT_VERSION = [^;]+;/.test(p)) throw new Error('Could not find MARKETING_VERSION / CURRENT_PROJECT_VERSION in project.pbxproj');
p = p.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${name};`)
     .replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${build};`);
fs.writeFileSync(proj, p);

// ---- Info.plist keys ----
let s = fs.readFileSync(plist, 'utf8');
const add = (key, xml) => {
  if (s.includes(`<key>${key}</key>`)) return;
  const i = s.lastIndexOf('</dict>');
  if (i < 0) throw new Error('Could not find the end of Info.plist');
  s = s.slice(0, i) + `\t<key>${key}</key>\n\t${xml}\n` + s.slice(i);
};
add('ITSAppUsesNonExemptEncryption', '<false/>');       // the app uses no special encryption: skips the export-compliance question on every upload
add('UIRequiresFullScreen', '<true/>');                  // no iPad split view: the games always fill the screen
add('UIStatusBarHidden', '<true/>');
add('UIViewControllerBasedStatusBarAppearance', '<false/>');
fs.writeFileSync(plist, s);

console.log(`iOS version ${name} (${build}) and Info.plist keys set.`);
