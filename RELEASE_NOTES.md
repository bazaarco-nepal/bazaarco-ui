# BazaarCo Nepal Mobile Release Model

## Temporary working shell

The current Phase 1 native projects load `https://www.bazaarconepal.com` through Capacitor
`server.url`. This preserves the existing server-rendered website and provides installable Android
and iOS shells immediately.

This is intentionally temporary. It requires connectivity on first launch and does not provide the
bundled offline behavior planned for the final release. Remove `server.url` after the dedicated
static mobile build is ready.

The final Capacitor application will bundle the Next.js static export into the iOS and Android
binaries.

Changes in `bazaarco-ui` and changes in the embedded `bazaarco-mobile` video module both require:

1. Build the combined application.
2. Upload to TestFlight and the Google Play Internal or Closed Testing track.
3. Test on real devices, including a budget Android device.
4. Submit a new store version for review.
5. Users install the approved update.

Use TestFlight and Play internal testing continuously. Batch public releases weekly or biweekly
where practical. OTA JavaScript update tooling is intentionally out of scope for Phase 1.

The Android signing keystore and iOS signing credentials must be generated and backed up outside
Git before the first signed build. The permanent package identifier is `com.bazaarconepal.app`.
