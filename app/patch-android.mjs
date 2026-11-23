// Run inside app/ after `npx cap add android`: sets the version and (when a key is given) release signing.
import fs from 'node:fs';
const file = 'android/app/build.gradle';
let s = fs.readFileSync(file, 'utf8');
const code = process.env.VERSION_CODE || '1', name = process.env.VERSION_NAME || '1.0.0';

if (!/versionCode\s+\d+/.test(s) || !/versionName\s+"[^"]*"/.test(s)) throw new Error('Could not find versionCode / versionName in build.gradle');
s = s.replace(/versionCode\s+\d+/, `versionCode ${code}`).replace(/versionName\s+"[^"]*"/, `versionName "${name}"`);

if (process.env.ANDROID_KEYSTORE_PATH) {
  const signing = `
    signingConfigs {
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            storeType "pkcs12"
        }
    }
`;
  if (!/buildTypes\s*\{/.test(s)) throw new Error('Could not find buildTypes in build.gradle');
  s = s.replace(/(\n\s*)buildTypes\s*\{/, `${signing}$1buildTypes {`);
  s = s.replace(/(buildTypes\s*\{\s*release\s*\{)/, `$1\n            signingConfig signingConfigs.release`);
  if (!s.includes('signingConfig signingConfigs.release')) throw new Error('Could not attach the signing config to the release build type');
  console.log('Release signing configured.');
} else {
  console.log('No signing key given: the release bundle will be unsigned (fine for checking the build).');
}
fs.writeFileSync(file, s);

// ---- Screen lock plugin (Android screen pinning) ----
// Lets the parent area pin the app so a child cannot leave it (no Home, no Recents, no notification shade).
// Android asks the grown-up to confirm the first time. The web side calls Capacitor.Plugins.ScreenLock.
const pkgDir = 'android/app/src/main/java/app/littleplay/steam';
if (!fs.existsSync(pkgDir)) throw new Error('Could not find ' + pkgDir);
fs.writeFileSync(pkgDir + '/ScreenLockPlugin.java', `package app.littleplay.steam;

import android.app.ActivityManager;
import android.content.Context;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ScreenLock")
public class ScreenLockPlugin extends Plugin {
    private boolean isLocked() {
        ActivityManager am = (ActivityManager) getContext().getSystemService(Context.ACTIVITY_SERVICE);
        return am != null && am.getLockTaskModeState() != ActivityManager.LOCK_TASK_MODE_NONE;
    }

    @PluginMethod
    public void start(final PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try { getActivity().startLockTask(); } catch (Exception e) { /* ignored: the web side shows the lock only when it is on */ }
            call.resolve();
        });
    }

    @PluginMethod
    public void stop(final PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try { getActivity().stopLockTask(); } catch (Exception e) { /* not locked */ }
            call.resolve();
        });
    }

    @PluginMethod
    public void state(PluginCall call) {
        JSObject r = new JSObject();
        r.put("locked", isLocked());
        call.resolve(r);
    }
}
`);
fs.writeFileSync(pkgDir + '/MainActivity.java', `package app.littleplay.steam;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ScreenLockPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
`);
console.log('Screen lock plugin added.');

console.log(`versionCode ${code}, versionName ${name}`);
console.log('--- android/app/build.gradle (head) ---');
console.log(s.split('\n').slice(0, 60).join('\n'));
