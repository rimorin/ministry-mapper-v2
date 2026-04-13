# [1.34.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.33.2...v1.34.0) (2026-04-13)


### Bug Fixes

* add setHasAnyMaps to useAdminData hook for better map state management ([e3db5d0](https://github.com/rimorin/ministry-mapper-v2/commit/e3db5d091cbf87b15ef34a89affe6ef1b71eae57))
* correct unread message count tracking and map existence check ([9ac8374](https://github.com/rimorin/ministry-mapper-v2/commit/9ac8374680cb8117f172ee0067dacf0fe989ce5b))
* optimize data fetching by using Promise.all in useAdminData hook ([7164dbe](https://github.com/rimorin/ministry-mapper-v2/commit/7164dbe460f1d5cda3ca2d999c1b1eda0784e6b3))
* reduce overscan count in MapListing component for performance optimization ([d4a1032](https://github.com/rimorin/ministry-mapper-v2/commit/d4a1032b1585c5278fa30f968f80b17fe46bd82d))
* removed visibility management ([cf62125](https://github.com/rimorin/ministry-mapper-v2/commit/cf62125173b028de97b26496923b2dc0a11feb1e))
* update announcement messages for clarity and consistency across release notes ([017ac62](https://github.com/rimorin/ministry-mapper-v2/commit/017ac6292e36e2fd56dd8aa131177a4926696e6c))
* update map fetching to use paginated list and adjust response handling ([4f68c28](https://github.com/rimorin/ministry-mapper-v2/commit/4f68c2819d1b78e37bbf4e536f14af51b72de874))
* update PB_FIELDS to include additional address options in fetchAddressData ([778a48e](https://github.com/rimorin/ministry-mapper-v2/commit/778a48e6824368801f19463b54d7180e6ee41db3))
* update territory coordinates handling in Admin component ([9490abe](https://github.com/rimorin/ministry-mapper-v2/commit/9490abe591312c57f8ee07e14180a3827aae511a))


### Features

* add LanguageBtn component and fix dark mode SVG filter ([86c44c3](https://github.com/rimorin/ministry-mapper-v2/commit/86c44c39acc53f1d676cd1b43dc2f2d6f6e6984a))
* add release history button next to theme toggle ([998182e](https://github.com/rimorin/ministry-mapper-v2/commit/998182eadcbd27f2bfbaceb237d426d21a8bf9ee))

## [1.33.2](https://github.com/rimorin/ministry-mapper-v2/compare/v1.33.1...v1.33.2) (2026-04-10)


### Bug Fixes

* add created_by and source fields to address creation and extract userName from policy ([e0b1af9](https://github.com/rimorin/ministry-mapper-v2/commit/e0b1af9188972d298b2a7842e201d0dfa88e98a2))

## [1.33.1](https://github.com/rimorin/ministry-mapper-v2/compare/v1.33.0...v1.33.1) (2026-04-09)


### Bug Fixes

* add missing territoryId for address creation modal ([4642b5b](https://github.com/rimorin/ministry-mapper-v2/commit/4642b5b9f625e7b48273e3b6a0cfd703895e5353))

# [1.33.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.32.6...v1.33.0) (2026-04-08)


### Bug Fixes

* adjust image styling in ReleaseNotesModal for better visibility ([bb983b5](https://github.com/rimorin/ministry-mapper-v2/commit/bb983b581f769fcf9e2fcb0571620ec0a01da2e6))


### Features

* add address on the fly for single story maps ([08a587b](https://github.com/rimorin/ministry-mapper-v2/commit/08a587bb0b507d6c862b7eef6c0125eee9d9fbfa))
* enhance release notes structure and rendering for better user experience ([b563e4d](https://github.com/rimorin/ministry-mapper-v2/commit/b563e4d7e0c59027336d3d4d3a653113a84f00f5))
* implement localized release notes ([fc44781](https://github.com/rimorin/ministry-mapper-v2/commit/fc447812ee4e21434bcdc37747c7d6d9a06cd9c1))

## [1.32.6](https://github.com/rimorin/ministry-mapper-v2/compare/v1.32.5...v1.32.6) (2026-04-06)


### Bug Fixes

* add preconnect and dns-prefetch links for improved performance ([631b0c4](https://github.com/rimorin/ministry-mapper-v2/commit/631b0c4ad45b25b04c2a982f52a49af92f37dd3b))
* add skipTotal option to getList in getPaginatedList function ([d9e8670](https://github.com/rimorin/ministry-mapper-v2/commit/d9e867012835a6839d126dd8a6ed6f20a2242ec0))
* conditionally include TurboConsole plugin based on production environment ([e341ad2](https://github.com/rimorin/ministry-mapper-v2/commit/e341ad25edeb82cf8efbf5c5aede07085973b339))
* handle non-JSON response in useReleaseNotes hook ([f35c995](https://github.com/rimorin/ministry-mapper-v2/commit/f35c99521b0388b13cd287e13cee889e46b21e8e))
* optimize fetchCongregationData to retrieve options and territories in parallel ([f0e7dac](https://github.com/rimorin/ministry-mapper-v2/commit/f0e7dacb9ececf1c31e4300b6a9e51154c517ddb))


### Performance Improvements

* defer vendor-mapping and vendor-ui chunks via lazy loading ([ead3067](https://github.com/rimorin/ministry-mapper-v2/commit/ead3067e2348a7ebcd2260b01f8cd9cd7de617f7))
* stabilise context values to prevent spurious re-renders ([d85ce1a](https://github.com/rimorin/ministry-mapper-v2/commit/d85ce1a65bed16d78801f0d3781e373ae3679581))

## [1.32.5](https://github.com/rimorin/ministry-mapper-v2/compare/v1.32.4...v1.32.5) (2026-04-05)


### Bug Fixes

* eliminate loader flashing and animation reset on initial load ([8047743](https://github.com/rimorin/ministry-mapper-v2/commit/8047743279fdd0e6d232f65dc7c03a62b3a0158c))
* race condition of batch for slow connection or dropouts ([b9161d3](https://github.com/rimorin/ministry-mapper-v2/commit/b9161d3ab018c2d89907309301607008bb005b03))

## [1.32.4](https://github.com/rimorin/ministry-mapper-v2/compare/v1.32.3...v1.32.4) (2026-04-04)


### Bug Fixes

* enhance version check to handle non-JSON responses and improve error handling ([9ed931a](https://github.com/rimorin/ministry-mapper-v2/commit/9ed931afa7249cb772acb34e11800201490ab01d))
* implement withRetry function for async operations with exponential backoff and jitter ([ba2c2f7](https://github.com/rimorin/ministry-mapper-v2/commit/ba2c2f7230379a4855649b72852ac59d911d033e))
* improve test setup by stubbing global fetch and ensuring cleanup ([c4a7283](https://github.com/rimorin/ministry-mapper-v2/commit/c4a728342fd337500dee51ba2f09804aafa10047))
* issue on disconnecting SSE logic ([e968b80](https://github.com/rimorin/ministry-mapper-v2/commit/e968b80e3503f8f9632ac8467bd5a7c5c903624f))
* refactor UpdateUnitStatus to use createBatch for atomic operations ([447eea8](https://github.com/rimorin/ministry-mapper-v2/commit/447eea8edb586666caf5a28ffb1898ea2ab364ae))

## [1.32.3](https://github.com/rimorin/ministry-mapper-v2/compare/v1.32.2...v1.32.3) (2026-04-03)


### Bug Fixes

* add service worker to kill SW and handle stale versions ([299bbd5](https://github.com/rimorin/ministry-mapper-v2/commit/299bbd50332ae83f427d28e60ff46d2cc1b49b7d))

## [1.32.2](https://github.com/rimorin/ministry-mapper-v2/compare/v1.32.1...v1.32.2) (2026-04-01)


### Bug Fixes

* add announcement type to release notes and update translations ([c4cd2ef](https://github.com/rimorin/ministry-mapper-v2/commit/c4cd2ef61f9b91fa10f83f186e511895fa5df411))
* add backend health middleware with offline handling and translations ([d309dd1](https://github.com/rimorin/ministry-mapper-v2/commit/d309dd11730f7312e8e04564613cd3a005cf1faf))
* add PWA middleware and unsupported access handling with translations ([593e439](https://github.com/rimorin/ministry-mapper-v2/commit/593e439694e4ddd91a29f1a6e555142850075d99))
* optimize parallel processing of address options deletion and creation ([85f3ad4](https://github.com/rimorin/ministry-mapper-v2/commit/85f3ad4c8d4935619a0bf9f441b7fb7938309e9b))

## [1.32.1](https://github.com/rimorin/ministry-mapper-v2/compare/v1.32.0...v1.32.1) (2026-04-01)


### Bug Fixes

* include notice in release notes parsing condition ([1ae4b49](https://github.com/rimorin/ministry-mapper-v2/commit/1ae4b490d3aaa6b5bf9ade5b400843506e92f36a))

# [1.32.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.31.0...v1.32.0) (2026-03-31)


### Features

* address options table migration ([8fcc7dd](https://github.com/rimorin/ministry-mapper-v2/commit/8fcc7dd93a5a81d52f8642da6eb94aff2a0dd331))

# [1.31.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.30.0...v1.31.0) (2026-03-30)


### Features

* enhance assignment messaging with personalized greetings and expiry formatting ([b019619](https://github.com/rimorin/ministry-mapper-v2/commit/b019619f0a4b1fc8b3c435d36c91f53ec88f869d))
* integrate Umami analytics tracking across various components ([295de70](https://github.com/rimorin/ministry-mapper-v2/commit/295de70d01ef51ffad73f70698e9217102afad55))

# [1.30.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.29.0...v1.30.0) (2026-03-26)


### Bug Fixes

* remove unnecessary emailVisibility field from signup form data ([1a156b5](https://github.com/rimorin/ministry-mapper-v2/commit/1a156b5c7eef6602401a5d8ab0bbfe9792359fe3))


### Features

* add congregation report generation feature with translations and UI integration ([0fb3d28](https://github.com/rimorin/ministry-mapper-v2/commit/0fb3d2883a7ecf619bf924c5f7e37299caf6bcc3))
* implement scroll persistence for map listing ([7c15844](https://github.com/rimorin/ministry-mapper-v2/commit/7c15844171d229c5083b4cdae508ebea5412df65))
* update release notes for 2026-03-27 with new features and improvements ([d7b4a40](https://github.com/rimorin/ministry-mapper-v2/commit/d7b4a40bcd22b699e5b11cd79768b6e37292852d))
* update report generation messages to include activity duration ([1ddc674](https://github.com/rimorin/ministry-mapper-v2/commit/1ddc674e414f03d3f5af7618f99545553478cbea))

# [1.29.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.28.0...v1.29.0) (2026-03-10)


### Features

* add marker guide legend to map view and update translations ([1ae0652](https://github.com/rimorin/ministry-mapper-v2/commit/1ae0652a5d65d7e7e83ad63027df586db698a9c2))

# [1.28.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.27.0...v1.28.0) (2026-03-02)


### Bug Fixes

* show version display in staging environment ([9e62ea5](https://github.com/rimorin/ministry-mapper-v2/commit/9e62ea544a33124c4eceec4731bfdcbfb54554bf))


### Features

* implement release notes feature with context and modal display ([c646884](https://github.com/rimorin/ministry-mapper-v2/commit/c64688458e60ef03bea49ebbcd2bed4599d4fdfb))

# [1.27.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.26.0...v1.27.0) (2026-02-19)


### Bug Fixes

* add territory code existence check and warning notification ([deb3652](https://github.com/rimorin/ministry-mapper-v2/commit/deb36525ac60efe8f8a6039b475136dbfd14ead2))


### Features

* add fields parameter to role and territory checks ([7652886](https://github.com/rimorin/ministry-mapper-v2/commit/7652886ab3ce2a8808120d788004b484fb6ec7fb))

# [1.26.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.25.1...v1.26.0) (2026-02-13)


### Features

* improved version notification ([718cb99](https://github.com/rimorin/ministry-mapper-v2/commit/718cb996498fd37ae4156ef629888988bae92d25))

## [1.25.1](https://github.com/rimorin/ministry-mapper-v2/compare/v1.25.0...v1.25.1) (2026-02-11)


### Performance Improvements

* sentry bundle optimizations ([d4cfa0c](https://github.com/rimorin/ministry-mapper-v2/commit/d4cfa0ce432367cf3d8d70b14ca932fe31686b53))

# [1.25.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.24.1...v1.25.0) (2026-02-08)


### Bug Fixes

* verification module styling ([c55e8dc](https://github.com/rimorin/ministry-mapper-v2/commit/c55e8dc44600d705bf1a40a2e854e738d8b10260))


### Features

* add territory polygon implementation and overall leaflet map improvements ([016afb0](https://github.com/rimorin/ministry-mapper-v2/commit/016afb020c9cfb544701d04d1b271cd34c2d78c6))

## [1.24.1](https://github.com/rimorin/ministry-mapper-v2/compare/v1.24.0...v1.24.1) (2026-01-31)


### Bug Fixes

* add fields for users and maps sequence ([b91418f](https://github.com/rimorin/ministry-mapper-v2/commit/b91418f5d63dec0148e4ea91123e6b91f760b662))

# [1.24.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.23.0...v1.24.0) (2026-01-16)


### Features

* improve sequence implementation ([11ba897](https://github.com/rimorin/ministry-mapper-v2/commit/11ba897d943dca66d5aa916361a9efd6f30002ab))

# [1.23.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.22.0...v1.23.0) (2026-01-07)


### Features

* implement live location tracking ([ecfba90](https://github.com/rimorin/ministry-mapper-v2/commit/ecfba90289a2ec8159f6dd685545e337ae6c10b8))

# [1.22.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.21.0...v1.22.0) (2026-01-06)


### Features

* add Getting Started guide with step-by-step instructions and related translations ([ad67856](https://github.com/rimorin/ministry-mapper-v2/commit/ad67856d0066f87795cb5b6eb4f5631b6be8666a))
* add Spanish language support with translation file and language option ([66d2911](https://github.com/rimorin/ministry-mapper-v2/commit/66d291101828336263952dd42079bc05b04652b9))
* enhance Getting Started component with step completion and locking logic ([3c978fb](https://github.com/rimorin/ministry-mapper-v2/commit/3c978fb6be4d122c37459dcf07a845040e9f6fe4))

# [1.21.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.20.0...v1.21.0) (2026-01-01)


### Features

* add error boundary component and related hooks for improved error handling ([ca6fba3](https://github.com/rimorin/ministry-mapper-v2/commit/ca6fba363e67ccfae9978ab0540bf110c0058c55))
* implement confirmation dialogs for delete and reset actions ([bc60b68](https://github.com/rimorin/ministry-mapper-v2/commit/bc60b682c8ef9467fa09659dcf518cfcce08e289))

# [1.20.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.19.0...v1.20.0) (2025-12-31)


### Features

* add network status banner and related hooks for online/offline detection ([a66a4ab](https://github.com/rimorin/ministry-mapper-v2/commit/a66a4aba9d94e68ff7bdab4cb18572f403eff652))

# [1.19.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.18.0...v1.19.0) (2025-12-29)


### Bug Fixes

* streamline link expiration handling in Map component ([ae41933](https://github.com/rimorin/ministry-mapper-v2/commit/ae419338549953b3226285444de04ca0becd36d6))


### Features

* add StaticPageCard component for displaying static content with optional logo ([3b60d9d](https://github.com/rimorin/ministry-mapper-v2/commit/3b60d9df0c8d872b916e7cfb0ab7fa6f0fc47ddf))
* implement lazy loading for translations ([0d623ce](https://github.com/rimorin/ministry-mapper-v2/commit/0d623cea0418f2b5171e998a09c7252a1146b29a))

# [1.18.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.17.0...v1.18.0) (2025-12-19)


### Features

* improve UX for cong options module ([207c06c](https://github.com/rimorin/ministry-mapper-v2/commit/207c06c1ce364535a43f356b1642237bdffca9b0))

# [1.17.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.16.2...v1.17.0) (2025-12-05)


### Features

* implement territory map sequence dnd UI ([8148639](https://github.com/rimorin/ministry-mapper-v2/commit/8148639cbf39affb68e80f5c1853406b815b33a6))

## [1.16.2](https://github.com/rimorin/ministry-mapper-v2/compare/v1.16.1...v1.16.2) (2025-11-24)


### Bug Fixes

* realtime listener unsub logic ([88e3e56](https://github.com/rimorin/ministry-mapper-v2/commit/88e3e56cb43e3769fd1997e3dda0e7009af0a545))

## [1.16.1](https://github.com/rimorin/ministry-mapper-v2/compare/v1.16.0...v1.16.1) (2025-11-22)


### Bug Fixes

* handle failed dynamic imports on new deployments ([d8218e4](https://github.com/rimorin/ministry-mapper-v2/commit/d8218e46b10b11406681bb0f19c27373f05bf2fc))

# [1.16.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.15.0...v1.16.0) (2025-11-20)


### Features

* enhancement on endpoint rules ([b428f17](https://github.com/rimorin/ministry-mapper-v2/commit/b428f1721a5e985d451166cd0eae1ba85d7523f4))

# [1.15.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.14.0...v1.15.0) (2025-11-17)


### Bug Fixes

* improve address dropdown direction logic ([cecb815](https://github.com/rimorin/ministry-mapper-v2/commit/cecb815e6fb31665f28d59620869a2aa3683b253))


### Features

* migration to leaflet mapping library ([89adff3](https://github.com/rimorin/ministry-mapper-v2/commit/89adff32522aa6e8fd09593cfd4bed92b2ace16f))

# [1.14.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.13.0...v1.14.0) (2025-10-31)


### Bug Fixes

* mismatch of territory change message ([3a5a3c2](https://github.com/rimorin/ministry-mapper-v2/commit/3a5a3c23b9e1a7ed845c2e0d17da232c234a6998))
* missing dark mode for pinned messages ([9d7a3ce](https://github.com/rimorin/ministry-mapper-v2/commit/9d7a3ce068424a1f8d103032243c9d74cb9c41e9))
* prevent service worker from serving HTML for missing chunks ([911d76f](https://github.com/rimorin/ministry-mapper-v2/commit/911d76fddf78d7aad6ecdfe9da1c45908c98a63a))


### Features

* add back button during otp ([a8f3b8a](https://github.com/rimorin/ministry-mapper-v2/commit/a8f3b8a1061e00b6e6cbcc7ba2b2c03cab5e0fee))

# [1.13.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.12.1...v1.13.0) (2025-10-30)


### Bug Fixes

* handle validation errors ([35aafa1](https://github.com/rimorin/ministry-mapper-v2/commit/35aafa182b61ec5705fdeddbd82c40464eeec143))


### Features

* implement toast notification ([d5611fa](https://github.com/rimorin/ministry-mapper-v2/commit/d5611fa2ad3734bc71acb0681bdbad91fa07ff5a))

## [1.12.1](https://github.com/rimorin/ministry-mapper-v2/compare/v1.12.0...v1.12.1) (2025-10-27)


### Bug Fixes

* increase overscanCount to render more items at list edges ([1bdd7af](https://github.com/rimorin/ministry-mapper-v2/commit/1bdd7afe14231a48d194d070185eccd53e017352))

# [1.12.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.11.2...v1.12.0) (2025-10-24)


### Features

* google maps new places api migration ([492ed39](https://github.com/rimorin/ministry-mapper-v2/commit/492ed398480155df213d727e51db45359c59043e))

## [1.11.2](https://github.com/rimorin/ministry-mapper-v2/compare/v1.11.1...v1.11.2) (2025-10-22)


### Bug Fixes

* handle invite query for oauth users ([5aef92e](https://github.com/rimorin/ministry-mapper-v2/commit/5aef92ea77829a55ed4747120a750734b5e1156c))
* missing dark mode settings for speed dial, quick link and placeholder ([6d8eba3](https://github.com/rimorin/ministry-mapper-v2/commit/6d8eba32f2b1994fe2ddf1a447f89fe1696ca7c5))

## [1.11.1](https://github.com/rimorin/ministry-mapper-v2/compare/v1.11.0...v1.11.1) (2025-10-22)


### Bug Fixes

* floating label in dark mode ([58799db](https://github.com/rimorin/ministry-mapper-v2/commit/58799dbfd5286f59479ea58e038a8b2ca68add5c))
* missing theme toggle in frontpage ([1380e58](https://github.com/rimorin/ministry-mapper-v2/commit/1380e581c74128acc68bbbe9c0998906ba5be4e3))

# [1.11.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.10.0...v1.11.0) (2025-10-21)


### Bug Fixes

* disable auto complete for various inputs ([4908a9d](https://github.com/rimorin/ministry-mapper-v2/commit/4908a9d74c7f5aff549df064a1acd7ef19464cab))


### Features

* implement dark mode ([6fc86be](https://github.com/rimorin/ministry-mapper-v2/commit/6fc86bee0a91a2cbdf736b475a6ba0362fc65c7f))

# [1.10.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.9.3...v1.10.0) (2025-10-17)


### Features

* implement google oauth ([603f363](https://github.com/rimorin/ministry-mapper-v2/commit/603f3633f87135b01b5a4cc2654d504959e42ab9))

## [1.9.3](https://github.com/rimorin/ministry-mapper-v2/compare/v1.9.2...v1.9.3) (2025-10-14)


### Bug Fixes

* improve branding element for oauth verification ([bf7aace](https://github.com/rimorin/ministry-mapper-v2/commit/bf7aace8d5f05d23e1223309ec766ca959b27153))

## [1.9.2](https://github.com/rimorin/ministry-mapper-v2/compare/v1.9.1...v1.9.2) (2025-10-05)


### Bug Fixes

* dropdown btn alignment for small/large devices ([6d86821](https://github.com/rimorin/ministry-mapper-v2/commit/6d868219ad3291891c49aef7e91ab5a1c00d1f24))

## [1.9.1](https://github.com/rimorin/ministry-mapper-v2/compare/v1.9.0...v1.9.1) (2025-10-02)


### Bug Fixes

* address code deletion issue ([e7708d9](https://github.com/rimorin/ministry-mapper-v2/commit/e7708d9103f9ec333d42fab6beef50a1f7a74d1a))

# [1.9.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.8.3...v1.9.0) (2025-10-02)


### Bug Fixes

* address dropdown direction ([70a7358](https://github.com/rimorin/ministry-mapper-v2/commit/70a7358d5d45312874cd3c4da136ad0b68237e0b))


### Features

* implement drag and drop sequence module ([3d6e8c7](https://github.com/rimorin/ministry-mapper-v2/commit/3d6e8c7da2276b38f3d9197c4d39982f6c8e364d))

## [1.8.3](https://github.com/rimorin/ministry-mapper-v2/compare/v1.8.2...v1.8.3) (2025-09-30)


### Bug Fixes

* dup invite ([ca3e08f](https://github.com/rimorin/ministry-mapper-v2/commit/ca3e08fa607917cbdb7480fd8813dd2703518674))

## [1.8.2](https://github.com/rimorin/ministry-mapper-v2/compare/v1.8.1...v1.8.2) (2025-09-24)


### Bug Fixes

* pwa caching strategies ([de2b410](https://github.com/rimorin/ministry-mapper-v2/commit/de2b410d56bd54ad8385f21b419bae49a441048d))

## [1.8.1](https://github.com/rimorin/ministry-mapper-v2/compare/v1.8.0...v1.8.1) (2025-09-24)


### Bug Fixes

* pwa configuration for caching ([7ece233](https://github.com/rimorin/ministry-mapper-v2/commit/7ece2338b13989728118baedf6b3b7bc5b4ecc76))

# [1.8.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.7.1...v1.8.0) (2025-09-24)


### Features

* pwa implementation ([e14b1ec](https://github.com/rimorin/ministry-mapper-v2/commit/e14b1ec36b466f8f088ebd77994d776b82edebc4))

## [1.7.1](https://github.com/rimorin/ministry-mapper-v2/compare/v1.7.0...v1.7.1) (2025-09-15)


### Bug Fixes

* undefined linkId when generating QL ([e03cd45](https://github.com/rimorin/ministry-mapper-v2/commit/e03cd45e249860b3a1f952d71f51018eec75d1b9))

# [1.7.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.6.1...v1.7.0) (2025-09-12)


### Features

* implement virtual listing for better performance ([d393dfe](https://github.com/rimorin/ministry-mapper-v2/commit/d393dfedc44ba685c6cc70dd878cfc86a664b046))

## [1.6.1](https://github.com/rimorin/ministry-mapper-v2/compare/v1.6.0...v1.6.1) (2025-09-08)


### Performance Improvements

* improve add query by removing expand ([fd8f40d](https://github.com/rimorin/ministry-mapper-v2/commit/fd8f40d29e60796d118bdd8798900824b2f1a931))

# [1.6.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.5.3...v1.6.0) (2025-09-07)


### Features

* implement terrtory quick link feature ([#54](https://github.com/rimorin/ministry-mapper-v2/issues/54)) ([d722ea5](https://github.com/rimorin/ministry-mapper-v2/commit/d722ea56f7df006bb10f3f25ab85b27d80c5648e))

## [1.5.3](https://github.com/rimorin/ministry-mapper-v2/compare/v1.5.2...v1.5.3) (2025-09-05)


### Bug Fixes

* broken gmaps rendering for empty add coordinates ([#57](https://github.com/rimorin/ministry-mapper-v2/issues/57)) ([1070d39](https://github.com/rimorin/ministry-mapper-v2/commit/1070d3970b0e21a186d0babebf7feab2519a76c1))

## [1.5.2](https://github.com/rimorin/ministry-mapper-v2/compare/v1.5.1...v1.5.2) (2025-09-03)


### Bug Fixes

* unable to retrieve dnc time in update modal ([#56](https://github.com/rimorin/ministry-mapper-v2/issues/56)) ([578f9dc](https://github.com/rimorin/ministry-mapper-v2/commit/578f9dcb903cd4dd616b18ad776b6f9f8bb5dac8))

## [1.5.1](https://github.com/rimorin/ministry-mapper-v2/compare/v1.5.0...v1.5.1) (2025-07-31)


### Bug Fixes

* callback dep with territory update ([#52](https://github.com/rimorin/ministry-mapper-v2/issues/52)) ([fdfd7c9](https://github.com/rimorin/ministry-mapper-v2/commit/fdfd7c9c8c177f6bfee0ea2863104f468d9b45c0))

# [1.5.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.4.5...v1.5.0) (2025-07-21)


### Features

* add node 22+ requirement to engine ([#51](https://github.com/rimorin/ministry-mapper-v2/issues/51)) ([e5af173](https://github.com/rimorin/ministry-mapper-v2/commit/e5af1730881c9566afb1712ac4e214ddffcd0f0d))

## [1.4.5](https://github.com/rimorin/ministry-mapper-v2/compare/v1.4.4...v1.4.5) (2025-05-31)


### Bug Fixes

* useCallback dep for manage users ([4898abc](https://github.com/rimorin/ministry-mapper-v2/commit/4898abcca9a20c155e30bf5aceaf8f6ab41c585e))

## [1.4.4](https://github.com/rimorin/ministry-mapper-v2/compare/v1.4.3...v1.4.4) (2025-05-26)


### Bug Fixes

* house no update not working ([c28e008](https://github.com/rimorin/ministry-mapper-v2/commit/c28e00832f28bcfeaa98debb6184843fcc9ea6c8))

## [1.4.3](https://github.com/rimorin/ministry-mapper-v2/compare/v1.4.2...v1.4.3) (2025-05-22)


### Performance Improvements

* implement memo components ([#50](https://github.com/rimorin/ministry-mapper-v2/issues/50)) ([ead286f](https://github.com/rimorin/ministry-mapper-v2/commit/ead286fa792be4aeab3496f2732e8a85ec859576))

## [1.4.2](https://github.com/rimorin/ministry-mapper-v2/compare/v1.4.1...v1.4.2) (2025-05-14)


### Bug Fixes

* update unit no modal attributes ([2391a4f](https://github.com/rimorin/ministry-mapper-v2/commit/2391a4f5b0a996f62d944214ee74cc4d63e809b5))

## [1.4.1](https://github.com/rimorin/ministry-mapper-v2/compare/v1.4.0...v1.4.1) (2025-04-28)


### Bug Fixes

* i18n translation issue ([d8afdae](https://github.com/rimorin/ministry-mapper-v2/commit/d8afdae138bdc2fd5a6f4c12ee3d44da21cc2262))

# [1.4.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.3.3...v1.4.0) (2025-04-28)


### Features

* implement i18n internationalization ([#46](https://github.com/rimorin/ministry-mapper-v2/issues/46)) ([8d82ff1](https://github.com/rimorin/ministry-mapper-v2/commit/8d82ff1a15641a5a092532893b3ee46f14010ccf))

## [1.3.3](https://github.com/rimorin/ministry-mapper-v2/compare/v1.3.2...v1.3.3) (2025-04-14)


### Bug Fixes

* useEffects and react components ([#45](https://github.com/rimorin/ministry-mapper-v2/issues/45)) ([1d74750](https://github.com/rimorin/ministry-mapper-v2/commit/1d747509a4fa824a428bb6a29d18ec12ec1ad6f8))

## [1.3.2](https://github.com/rimorin/ministry-mapper-v2/compare/v1.3.1...v1.3.2) (2025-04-12)


### Bug Fixes

* ignore pb cancellation error ([#43](https://github.com/rimorin/ministry-mapper-v2/issues/43)) ([247bf99](https://github.com/rimorin/ministry-mapper-v2/commit/247bf9956bf856291899696ed47695e4e03c5343))

## [1.3.1](https://github.com/rimorin/ministry-mapper-v2/compare/v1.3.0...v1.3.1) (2025-04-12)


### Bug Fixes

* optimise realtime subscriptions request cancellations ([#42](https://github.com/rimorin/ministry-mapper-v2/issues/42)) ([1b5f9d0](https://github.com/rimorin/ministry-mapper-v2/commit/1b5f9d01d944306181b106948cc7732778a46d35))

# [1.3.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.2.2...v1.3.0) (2025-04-11)


### Features

* sentry migration ([#40](https://github.com/rimorin/ministry-mapper-v2/issues/40)) ([87bb411](https://github.com/rimorin/ministry-mapper-v2/commit/87bb4115583e19cf532352015a2940c887e4f9fa))

## [1.2.2](https://github.com/rimorin/ministry-mapper-v2/compare/v1.2.1...v1.2.2) (2025-04-10)


### Bug Fixes

* allow for parentheses when updating territory code ([#37](https://github.com/rimorin/ministry-mapper-v2/issues/37)) ([3bc174d](https://github.com/rimorin/ministry-mapper-v2/commit/3bc174d2252e09d868ec04f5f76ebec2d76e8361))
* bump again ([60c4d0e](https://github.com/rimorin/ministry-mapper-v2/commit/60c4d0ec075e6749c104daff54f98e012d14b312))
* version fix ([3acffda](https://github.com/rimorin/ministry-mapper-v2/commit/3acffda50065dc5fa46ee2883dffe60e70a7591c))

## [1.2.2](https://github.com/rimorin/ministry-mapper-v2/compare/v1.2.1...v1.2.2) (2025-04-10)


### Bug Fixes

* allow for parentheses when updating territory code ([#37](https://github.com/rimorin/ministry-mapper-v2/issues/37)) ([3bc174d](https://github.com/rimorin/ministry-mapper-v2/commit/3bc174d2252e09d868ec04f5f76ebec2d76e8361))
* version fix ([3acffda](https://github.com/rimorin/ministry-mapper-v2/commit/3acffda50065dc5fa46ee2883dffe60e70a7591c))

## [1.2.2](https://github.com/rimorin/ministry-mapper-v2/compare/v1.2.1...v1.2.2) (2025-04-10)


### Bug Fixes

* allow for parentheses when updating territory code ([#37](https://github.com/rimorin/ministry-mapper-v2/issues/37)) ([3bc174d](https://github.com/rimorin/ministry-mapper-v2/commit/3bc174d2252e09d868ec04f5f76ebec2d76e8361))

## [1.2.2](https://github.com/rimorin/ministry-mapper-v2/compare/v1.2.1...v1.2.2) (2025-04-10)


### Bug Fixes

* allow for parentheses when updating territory code ([#37](https://github.com/rimorin/ministry-mapper-v2/issues/37)) ([3bc174d](https://github.com/rimorin/ministry-mapper-v2/commit/3bc174d2252e09d868ec04f5f76ebec2d76e8361))

## [1.2.2](https://github.com/rimorin/ministry-mapper-v2/compare/v1.2.1...v1.2.2) (2025-03-23)


### Bug Fixes

* allow for parentheses when updating territory code ([#37](https://github.com/rimorin/ministry-mapper-v2/issues/37)) ([3bc174d](https://github.com/rimorin/ministry-mapper-v2/commit/3bc174d2252e09d868ec04f5f76ebec2d76e8361))

## [1.2.1](https://github.com/rimorin/ministry-mapper-v2/compare/v1.2.0...v1.2.1) (2025-02-22)


### Bug Fixes

* adjust cam control settings ([b639651](https://github.com/rimorin/ministry-mapper-v2/commit/b639651b0df77ea8cf458fa022ba1240e3b8d8c5))
* adjust visibility effects ([c82bbfb](https://github.com/rimorin/ministry-mapper-v2/commit/c82bbfb6d79a7a5bba8c9a049bb3cdecb5b779b9))

# [1.2.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.1.5...v1.2.0) (2025-02-17)


### Features

* implement map view for admin page ([837aca0](https://github.com/rimorin/ministry-mapper-v2/commit/837aca054bcdcee7afa613c351cc0a70db2bb857))

## [1.1.5](https://github.com/rimorin/ministry-mapper-v2/compare/v1.1.4...v1.1.5) (2025-02-13)


### Bug Fixes

* missing useVisibilityChange function in map page ([bd70512](https://github.com/rimorin/ministry-mapper-v2/commit/bd70512f5031e41246e479cbc35492e2c6adcccc))

## [1.1.4](https://github.com/rimorin/ministry-mapper-v2/compare/v1.1.3...v1.1.4) (2025-02-12)


### Bug Fixes

* implement browser visibility check to refresh page ([dfd5272](https://github.com/rimorin/ministry-mapper-v2/commit/dfd52727ec5b579e7bd0262280e30711ca60cbcb))

## [1.1.3](https://github.com/rimorin/ministry-mapper-v2/compare/v1.1.2...v1.1.3) (2025-02-04)


### Bug Fixes

* allow deletion of floor if there are more than one floor ([28e47f4](https://github.com/rimorin/ministry-mapper-v2/commit/28e47f439fff432ca8a739f3204061d78b7a49a7))

## [1.1.2](https://github.com/rimorin/ministry-mapper-v2/compare/v1.1.1...v1.1.2) (2025-01-31)


### Bug Fixes

* ensure sequence format when creating new maps ([89d791f](https://github.com/rimorin/ministry-mapper-v2/commit/89d791f61b1b886640d4816c5701e10a56df7cef))
* redirect to signin page when token is no longer valid ([6122a5b](https://github.com/rimorin/ministry-mapper-v2/commit/6122a5b310b02686193ccbc1e17662f1906208dc))

## [1.1.1](https://github.com/rimorin/ministry-mapper-v2/compare/v1.1.0...v1.1.1) (2025-01-30)


### Bug Fixes

* handle error with paste permission is not granted ([bc25dbc](https://github.com/rimorin/ministry-mapper-v2/commit/bc25dbc2ae02935d8c5b7b794f8d7bac9f18d888))
* improve pb subscription cancellation calls ([28fa170](https://github.com/rimorin/ministry-mapper-v2/commit/28fa1702f1b9f5105748d90704b462ca6d30af3a))

# [1.1.0](https://github.com/rimorin/ministry-mapper-v2/compare/v1.0.4...v1.1.0) (2025-01-28)


### Features

* migrate to wouter to reduce bundle size ([797088f](https://github.com/rimorin/ministry-mapper-v2/commit/797088f4e0556be0f1259f7b47f83b19bdc35eda))

## [1.0.4](https://github.com/rimorin/ministry-mapper-v2/compare/v1.0.3...v1.0.4) (2025-01-22)


### Bug Fixes

* ignore cancel share exception ([139dcfb](https://github.com/rimorin/ministry-mapper-v2/commit/139dcfba862e1ade456b7a42bb7d48c21386f7c3))

## [1.0.3](https://github.com/rimorin/ministry-mapper-v2/compare/v1.0.2...v1.0.3) (2025-01-17)


### Bug Fixes

* adjust assignment logic and improve test assignment using utc tz ([aa85428](https://github.com/rimorin/ministry-mapper-v2/commit/aa85428b4c7339af77d0fef13b47a087b0028761))

## [1.0.2](https://github.com/rimorin/ministry-mapper-v2/compare/v1.0.1...v1.0.2) (2025-01-17)


### Bug Fixes

* lowercase and trim email during sign in ([9354dc0](https://github.com/rimorin/ministry-mapper-v2/commit/9354dc07423aac3427931801607ac65195c04b12))
* optimised fields in queries ([b6d6c9a](https://github.com/rimorin/ministry-mapper-v2/commit/b6d6c9a1b9d134ae7c75f137b1ea345db2b20a76))

## [1.0.1](https://github.com/rimorin/ministry-mapper-v2/compare/v1.0.0...v1.0.1) (2025-01-14)


### Bug Fixes

* optimised address fetching logic ([15ef977](https://github.com/rimorin/ministry-mapper-v2/commit/15ef977a50aecfb594b73899bcdb04add7c1347a))

# 1.0.0 (2025-01-13)


### Bug Fixes

* address issue where assignment expiry date does not match congregation setting ([6b0eb14](https://github.com/rimorin/ministry-mapper-v2/commit/6b0eb147be186e832ce088ef81e82998acec33f5))
* remove apple maps redirection for open maps ([e7646b8](https://github.com/rimorin/ministry-mapper-v2/commit/e7646b89160e78dd9f7e83b5b24e963e75987ae1))


### Features

* first ministry mapper v2 commits ([306d7ef](https://github.com/rimorin/ministry-mapper-v2/commit/306d7ef76263f74a2aa8ac77442fcbcc756ba659))
