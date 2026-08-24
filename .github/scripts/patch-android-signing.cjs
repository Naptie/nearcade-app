const fs = require('fs');

const path = 'android/app/build.gradle';
let content = fs.readFileSync(path, 'utf8');

const signingConfigAnchor = 'signingConfigs {\n        debug {';
const uploadConfig = [
  'signingConfigs {',
  '        upload {',
  '            storeFile file(nearcadeUploadStoreFile)',
  '            storePassword nearcadeUploadStorePassword',
  '            keyAlias nearcadeUploadKeyAlias',
  '            keyPassword nearcadeUploadKeyPassword',
  '        }',
  '        debug {'
].join('\n');

if (!content.includes(signingConfigAnchor)) {
  throw new Error('signingConfigs anchor not found');
}
content = content.replace(signingConfigAnchor, uploadConfig, 1);

const releaseSigningAnchor = [
  '            // see https://reactnative.dev/docs/signed-apk-android.',
  '            signingConfig signingConfigs.debug'
].join('\n');
const releaseSigningPatched = [
  '            // see https://reactnative.dev/docs/signed-apk-android.',
  '            signingConfig signingConfigs.upload'
].join('\n');

if (!content.includes(releaseSigningAnchor)) {
  throw new Error('release signingConfig anchor not found');
}
content = content.replace(releaseSigningAnchor, releaseSigningPatched, 1);

fs.writeFileSync(path, content);
console.log('patched android/app/build.gradle');
