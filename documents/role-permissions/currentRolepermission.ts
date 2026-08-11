// module wise default permissions
export const DEFAULT_PERMISSIONS = [
  { module: 'dashboard', permissions: ['dashboard:read'] },
  {
    module: 'student',
    permissions: [
      'student:read',
      'student:create',
      'student:update',
      'student:delete',
      'student:promote',
      'student:transfer',
      'student:approve-admission',
    ],
  },
  {
    module: 'academic',
    permissions: [
      'academic:read',
      'academic:create',
      'academic:update',
      'academic:delete',
      'academic:manage-timetable',
      'academic:manage-syllabus',
      'academic:manage-homework',
    ],
  },
  {
    module: 'teacher',
    permissions: [
      'teacher:read',
      'teacher:create',
      'teacher:update',
      'teacher:delete',
      'teacher:assign',
    ],
  },
  {
    module: 'exam',
    permissions: [
      'exam:read',
      'exam:create',
      'exam:update',
      'exam:delete',
      'exam:grade-entry',
      'exam:publish',
      'exam:generate-report',
    ],
  },
  {
    module: 'attendance',
    permissions: [
      'attendance:read',
      'attendance:create',
      'attendance:update',
      'attendance:delete',
      'attendance:report',
      'attendance:approve-leave',
    ],
  },
  {
    module: 'fees',
    permissions: [
      'fees:read',
      'fees:create',
      'fees:update',
      'fees:delete',
      'fees:collect',
      'fees:discount',
      'fees:waive',
      'fees:refund',
      'fees:configure',
    ],
  },
  {
    module: 'income-category',
    permissions: [
      'income-category:read',
      'income-category:create',
      'income-category:update',
      'income-category:delete',
    ],
  },
  {
    module: 'income',
    permissions: [
      'income:read',
      'income:create',
      'income:update',
      'income:delete',
      'income:approve',
      'income:generate-report',
    ],
  },
  {
    module: 'voucher',
    permissions: [
      'voucher:read',
      'voucher:create',
      'voucher:update',
      'voucher:delete',
    ],
  },
  {
    module: 'expense',
    permissions: [
      'expense:read',
      'expense:create',
      'expense:update',
      'expense:delete',
      'expense:approve',
      'expense:generate-report',
    ],
  },
  {
    module: 'account',
    permissions: [
      'account:read',
      'account:create',
      'account:update',
      'account:delete',
      'account:reconcile',
      'account:export-ledger',
      'account:close-period',
      'account:generate-report',
    ],
  },
  {
    module: 'transport',
    permissions: [
      'transport:read',
      'transport:create',
      'transport:update',
      'transport:delete',
      'transport:assign',
    ],
  },
  {
    module: 'user',
    permissions: [
      'user:read',
      'user:create',
      'user:update',
      'user:delete',
      'user:assign-roles',
      'user:manage-roles',
    ],
  },
  {
    module: 'communication',
    permissions: [
      'communication:read',
      'communication:create',
      'communication:update',
      'communication:delete',
      'communication:publish',
      'communication:send',
      'communication:manage-templates',
    ],
  },
  {
    module: 'system',
    permissions: [
      'system:read',
      'system:create',
      'system:update',
      'system:delete',
      'system:manage-branches',
      'system:export',
    ],
  },
  { module: 'media', permissions: ['media:read', 'media:create', 'media:update', 'media:delete'] },
  {
    module: 'inventory',
    permissions: ['inventory:read', 'inventory:create', 'inventory:update', 'inventory:delete'],
  },
  {
    module: 'hr',
    permissions: ['hr:read', 'hr:write', 'hr:update', 'hr:delete'],
  },
];


// export const newper = {
//   academic:[
//   {
//     id: '71e60b09-ca51-4823-b13c-b31c96e1278d',
//     key: 'academic:create',
//     action: 'create',
//     description: 'Can create academic'
//   },
//   {
//     id: '9058d817-0970-4403-b9e6-c2b7b59ef7ee',
//     key: 'academic:delete',
//     action: 'delete',
//     description: 'Can delete academic'
//   },
//   {
//     id: 'a9b52a73-4bc3-4cc4-a479-38107c9b7f85',
//     key: 'academic:manage-homework',
//     action: 'manage-homework',
//     description: 'Can manage-homework academic'
//   },
//   {
//     id: 'b62dace5-7aa8-405b-a645-2006a1191d8a',
//     key: 'academic:manage-syllabus',
//     action: 'manage-syllabus',
//     description: 'Can manage-syllabus academic'
//   },
//   {
//     id: '3785689e-a5f9-4053-bf24-0fb2441b91b0',
//     key: 'academic:manage-timetable',
//     action: 'manage-timetable',
//     description: 'Can manage-timetable academic'
//   },
//   {
//     id: '18c1c743-c3d2-4cb4-8589-4c116bdf081d',
//     key: 'academic:read',
//     action: 'read',
//     description: 'Can read academic'
//   },
//   {
//     id: 'edd48cd0-7b7d-4089-a8c0-3a69e87a96ae',
//     key: 'academic:update',
//     action: 'update',
//     description: 'Can update academic'
//   }
// ],
//   account: [
//   {
//     id: '138c4af4-6a75-4951-b10a-faf4bd43ed50',
//     key: 'account:close-period',
//     action: 'close-period',
//     description: 'Can close-period account'
//   },
//   {
//     id: 'e04e67f8-6784-4ad4-aa88-b61a60093fce',
//     key: 'account:create',
//     action: 'create',
//     description: 'Can create account'
//   },
//   {
//     id: '1bfcbb23-dcd5-4f4e-868c-0c8a25239782',
//     key: 'account:delete',
//     action: 'delete',
//     description: 'Can delete account'
//   },
//   {
//     id: 'fb0e5913-2d3c-41d6-978a-f08e8dab80d2',
//     key: 'account:export-ledger',
//     action: 'export-ledger',
//     description: 'Can export-ledger account'
//   },
//   {
//     id: '33b2c999-7ff9-4dc8-b803-a9049c294c71',
//     key: 'account:generate-report',
//     action: 'generate-report',
//     description: 'Can generate-report account'
//   },
//   {
//     id: 'e81f0f85-2db1-4283-b0da-c1382269634f',
//     key: 'account:read',
//     action: 'read',
//     description: 'Can read account'
//   },
//   {
//     id: '2d2f578d-1bfc-4706-b775-277b3e1a7033',
//     key: 'account:reconcile',
//     action: 'reconcile',
//     description: 'Can reconcile account'
//   },
//   {
//     id: '137aeda8-3fca-49da-a71d-01679d35f9ab',
//     key: 'account:update',
//     action: 'update',
//     description: 'Can update account'
//   }
// ],
//   attendance: [
//   {
//     id: '34ec0c31-f745-4b7e-a882-c0b978345c4b',
//     key: 'attendance:approve-leave',
//     action: 'approve-leave',
//     description: 'Can approve-leave attendance'
//   },
//   {
//     id: '6e2fb5b8-402b-43be-978b-cf71d9273ff8',
//     key: 'attendance:create',
//     action: 'create',
//     description: 'Can create attendance'
//   },
//   {
//     id: '45e18c04-7fba-47a7-9d3b-9c81cc09feca',
//     key: 'attendance:delete',
//     action: 'delete',
//     description: 'Can delete attendance'
//   },
//   {
//     id: 'e8554794-9fca-4755-a4b4-c7f2c98338fc',
//     key: 'attendance:read',
//     action: 'read',
//     description: 'Can read attendance'
//   },
//   {
//     id: '0a324e6e-bdcd-4c75-9c89-167d8470ccfc',
//     key: 'attendance:report',
//     action: 'report',
//     description: 'Can report attendance'
//   },
//   {
//     id: 'e2c8af4f-bcce-4faf-b23c-5740d65891db',
//     key: 'attendance:update',
//     action: 'update',
//     description: 'Can update attendance'
//   }
// ],
//   communication: [
//   {
//     id: 'a3e7da3a-a61c-4669-ade8-cf1ab7e39a87',
//     key: 'communication:create',
//     action: 'create',
//     description: 'Can create communication'
//   },
//   {
//     id: '16ebed4a-0ada-4f16-b1d6-b5d6184a1839',
//     key: 'communication:delete',
//     action: 'delete',
//     description: 'Can delete communication'
//   },
//   {
//     id: '18e2b98f-319a-4091-9997-6f263bb7e516',
//     key: 'communication:manage-templates',
//     action: 'manage-templates',
//     description: 'Can manage-templates communication'
//   },
//   {
//     id: '53606ed7-4c65-4ec6-be12-21c1b734a7cc',
//     key: 'communication:publish',
//     action: 'publish',
//     description: 'Can publish communication'
//   },
//   {
//     id: 'ec382899-021c-44eb-ba94-6178168ff672',
//     key: 'communication:read',
//     action: 'read',
//     description: 'Can read communication'
//   },
//   {
//     id: '6492e800-4ccf-4be4-8fbf-7b9f0eaeda46',
//     key: 'communication:send',
//     action: 'send',
//     description: 'Can send communication'
//   },
//   {
//     id: '89ca9107-5c1b-4bd4-943f-41b12ec8d36e',
//     key: 'communication:update',
//     action: 'update',
//     description: 'Can update communication'
//   }
// ],
//   dashboard: [
//   {
//     id: 'd182a0dd-0a7f-430d-8369-a7cd4df84726',
//     key: 'dashboard:read',
//     action: 'read',
//     description: 'Can read dashboard'
//   }
// ],
//   exam: [
//   {
//     id: '628bb9f5-e1c6-4be3-a6c1-4aa1f3e14ec5',
//     key: 'exam:create',
//     action: 'create',
//     description: 'Can create exam'
//   },
//   {
//     id: '49479004-7bce-45a8-a1e2-eb684b620650',
//     key: 'exam:delete',
//     action: 'delete',
//     description: 'Can delete exam'
//   },
//   {
//     id: '17d4c240-9484-40f1-8239-b20720cdb549',
//     key: 'exam:generate-report',
//     action: 'generate-report',
//     description: 'Can generate-report exam'
//   },
//   {
//     id: '4f38ff44-79f6-4c83-bb01-32b6a6a8c4f0',
//     key: 'exam:grade-entry',
//     action: 'grade-entry',
//     description: 'Can grade-entry exam'
//   },
//   {
//     id: 'b6387bb1-8215-4242-ad9b-6418c3ae6f3e',
//     key: 'exam:publish',
//     action: 'publish',
//     description: 'Can publish exam'
//   },
//   {
//     id: '947a32b1-1662-48d5-8322-804fce91635b',
//     key: 'exam:read',
//     action: 'read',
//     description: 'Can read exam'
//   },
//   {
//     id: 'ca7a03e7-9f99-412f-b2c9-3b81fb14739f',
//     key: 'exam:update',
//     action: 'update',
//     description: 'Can update exam'
//   }
// ],
//   expense: [
//   {
//     id: '3ac77dd0-0934-4fa6-aec5-9e52a7640f28',
//     key: 'expense:approve',
//     action: 'approve',
//     description: 'Can approve expense'
//   },
//   {
//     id: 'aa325b42-fcf1-4e49-8ff1-814f3ab46775',
//     key: 'expense:create',
//     action: 'create',
//     description: 'Can create expense'
//   },
//   {
//     id: '2d8bf7b5-3e3e-467f-add8-7515f1aaf0aa',
//     key: 'expense:delete',
//     action: 'delete',
//     description: 'Can delete expense'
//   },
//   {
//     id: '12288196-dbdc-4197-92d7-aae0905934a5',
//     key: 'expense:generate-report',
//     action: 'generate-report',
//     description: 'Can generate-report expense'
//   },
//   {
//     id: '566f1bf1-8e92-450d-867d-577a0328174f',
//     key: 'expense:read',
//     action: 'read',
//     description: 'Can read expense'
//   },
//   {
//     id: '42093cc6-5a31-44ea-96c2-22690fcafa09',
//     key: 'expense:update',
//     action: 'update',
//     description: 'Can update expense'
//   }
// ],
//   fees: [
//   {
//     id: '4d467ea8-c22f-4279-9afa-906268e99ac5',
//     key: 'fees:collect',
//     action: 'collect',
//     description: 'Can collect fees'
//   },
//   {
//     id: '7c83f1a7-0891-438d-a0c9-897aef25d6e0',
//     key: 'fees:configure',
//     action: 'configure',
//     description: 'Can configure fees'
//   },
//   {
//     id: 'e485e01f-7008-4a0e-b588-9d2c0c0ad240',
//     key: 'fees:create',
//     action: 'create',
//     description: 'Can create fees'
//   },
//   {
//     id: '7d42eb27-90b2-4197-ad09-47d81d079308',
//     key: 'fees:delete',
//     action: 'delete',
//     description: 'Can delete fees'
//   },
//   {
//     id: 'c6e80872-7e79-40f6-9333-b1dd24ec2299',
//     key: 'fees:discount',
//     action: 'discount',
//     description: 'Can discount fees'
//   },
//   {
//     id: '53e1cfa0-bfe6-4e26-9209-8ab357180dd3',
//     key: 'fees:generate-report',
//     action: 'generate-report',
//     description: 'Can generate-report fees'
//   },
//   {
//     id: 'ebe3b2f7-a8da-4fbb-9978-7e2cf5eaf6c1',
//     key: 'fees:read',
//     action: 'read',
//     description: 'Can read fees'
//   },
//   {
//     id: 'cda83dac-2285-4788-8936-39712b03d592',
//     key: 'fees:refund',
//     action: 'refund',
//     description: 'Can refund fees'
//   },
//   {
//     id: 'e63267aa-f3a1-40b6-89cd-a71f29363b60',
//     key: 'fees:send-reminder',
//     action: 'send-reminder',
//     description: 'Can send-reminder fees'
//   },
//   {
//     id: '4ef92a41-e6f4-46be-a01a-a300d2e7dd23',
//     key: 'fees:update',
//     action: 'update',
//     description: 'Can update fees'
//   },
//   {
//     id: '03905ab8-18bf-435a-b2af-243d585d470d',
//     key: 'fees:waive',
//     action: 'waive',
//     description: 'Can waive fees'
//   }
// ],
//   income: [
//   {
//     id: '7fca987a-5e52-4813-822e-0fd149e451ae',
//     key: 'income:approve',
//     action: 'approve',
//     description: 'Can approve income'
//   },
//   {
//     id: 'a7e03980-f617-4105-b7ae-294eb2a7618b',
//     key: 'income:create',
//     action: 'create',
//     description: 'Can create income'
//   },
//   {
//     id: '411b0c8b-49fd-475b-b377-b048ae6986d8',
//     key: 'income:delete',
//     action: 'delete',
//     description: 'Can delete income'
//   },
//   {
//     id: '3be32d54-3f02-437c-8fcb-52888af7bd26',
//     key: 'income:generate-report',
//     action: 'generate-report',
//     description: 'Can generate-report income'
//   },
//   {
//     id: '47eec133-d30d-4d14-914f-b0172b456481',
//     key: 'income:read',
//     action: 'read',
//     description: 'Can read income'
//   },
//   {
//     id: '5cfa456c-6473-460f-ac46-f67606b7e7ef',
//     key: 'income:update',
//     action: 'update',
//     description: 'Can update income'
//   }
// ],
//   media: [
//   {
//     id: '2b5727e2-f4dd-4188-bcb6-796a19f13e13',
//     key: 'media:create',
//     action: 'create',
//     description: 'Can create media'
//   },
//   {
//     id: '37bd682c-8cc7-4a91-8303-f205b3d8237c',
//     key: 'media:delete',
//     action: 'delete',
//     description: 'Can delete media'
//   },
//   {
//     id: 'e8988549-4fa5-43db-9f9b-d743bb795551',
//     key: 'media:read',
//     action: 'read',
//     description: 'Can read media'
//   },
//   {
//     id: 'f21a4a81-541f-4217-84e1-8425b4eb499a',
//     key: 'media:update',
//     action: 'update',
//     description: 'Can update media'
//   }
// ],
//   student: [
//   {
//     id: 'e4fd8136-73c9-4cf6-ac42-ddce77b8f829',
//     key: 'student:approve-admission',
//     action: 'approve-admission',
//     description: 'Can approve-admission student'
//   },
//   {
//     id: 'ce5ef649-9dc3-4142-91c9-4e7178ac67e8',
//     key: 'student:create',
//     action: 'create',
//     description: 'Can create student'
//   },
//   {
//     id: '38093c97-3519-45df-b7bd-642e35b84565',
//     key: 'student:delete',
//     action: 'delete',
//     description: 'Can delete student'
//   },
//   {
//     id: '746f0e39-30ad-4f39-9dd6-125247aed695',
//     key: 'student:promote',
//     action: 'promote',
//     description: 'Can promote student'
//   },
//   {
//     id: 'f2988149-ba67-4f8e-8f46-9ee78478eb8f',
//     key: 'student:read',
//     action: 'read',
//     description: 'Can read student'
//   },
//   {
//     id: 'bab9ecc2-1ef4-4bb9-8980-6c508ec96442',
//     key: 'student:transfer',
//     action: 'transfer',
//     description: 'Can transfer student'
//   },
//   {
//     id: 'b8958ad3-ce59-45d5-8357-4f26d059b435',
//     key: 'student:update',
//     action: 'update',
//     description: 'Can update student'
//   }
// ],
//   system: [
//   {
//     id: 'ae03feed-0d1c-43da-adef-bfc633a406f0',
//     key: 'system:create',
//     action: 'create',
//     description: 'Can create system'
//   },
//   {
//     id: 'bcc97d69-2ca0-4d3e-86c4-de5aa2c488ea',
//     key: 'system:delete',
//     action: 'delete',
//     description: 'Can delete system'
//   },
//   {
//     id: '9ae9558a-b75c-48f9-a2eb-106cbe1e67f2',
//     key: 'system:export',
//     action: 'export',
//     description: 'Can export system'
//   },
//   {
//     id: '601be27b-44f2-4be3-8f2f-4128775ddd43',
//     key: 'system:manage-branches',
//     action: 'manage-branches',
//     description: 'Can manage-branches system'
//   },
//   {
//     id: 'f86c3305-6d6b-4060-b59c-61cef055ac7d',
//     key: 'system:read',
//     action: 'read',
//     description: 'Can read system'
//   },
//   {
//     id: 'a235fd5f-0912-4f05-8b47-4d0b1937d868',
//     key: 'system:update',
//     action: 'update',
//     description: 'Can update system'
//   }
// ],
//   teacher: [
//   {
//     id: '9d1fb769-aaf8-4b1a-94bb-62f5e86f5c99',
//     key: 'teacher:assign',
//     action: 'assign',
//     description: 'Can assign teacher'
//   },
//   {
//     id: '64ff79d7-e1bd-4028-afc1-bb98f29b6f47',
//     key: 'teacher:create',
//     action: 'create',
//     description: 'Can create teacher'
//   },
//   {
//     id: 'ff5d43f6-c5bd-44e3-ae69-2458d81d9653',
//     key: 'teacher:delete',
//     action: 'delete',
//     description: 'Can delete teacher'
//   },
//   {
//     id: 'ed04761a-2597-440d-ba9d-a70107ffb633',
//     key: 'teacher:read',
//     action: 'read',
//     description: 'Can read teacher'
//   },
//   {
//     id: '2a6a71f8-cfd3-4dc9-9634-56d9d14b17c2',
//     key: 'teacher:update',
//     action: 'update',
//     description: 'Can update teacher'
//   }
// ],
//   transport: [
//   {
//     id: 'e2effaf0-83fa-4d95-aa6a-4c3fe4a4d4dd',
//     key: 'transport:assign',
//     action: 'assign',
//     description: 'Can assign transport'
//   },
//   {
//     id: '6f822c3c-b67e-4379-9530-2b14b67609d4',
//     key: 'transport:create',
//     action: 'create',
//     description: 'Can create transport'
//   },
//   {
//     id: '164bcc88-3449-4570-900d-c011f587b10c',
//     key: 'transport:delete',
//     action: 'delete',
//     description: 'Can delete transport'
//   },
//   {
//     id: '0b0fd507-15be-43dd-ab8f-40d6dee66828',
//     key: 'transport:read',
//     action: 'read',
//     description: 'Can read transport'
//   },
//   {
//     id: 'e8b90a26-64b8-4942-80ac-8232df3f41d6',
//     key: 'transport:update',
//     action: 'update',
//     description: 'Can update transport'
//   }
// ],
//   user: [
//   {
//     id: '4e3e1091-1dd8-4ea6-8f97-c81143bbf20d',
//     key: 'user:assign-roles',
//     action: 'assign-roles',
//     description: 'Can assign-roles user'
//   },
//   {
//     id: 'e6acf4be-5c2a-4134-9136-0962596eb35d',
//     key: 'user:create',
//     action: 'create',
//     description: 'Can create user'
//   },
//   {
//     id: '797ebd68-b7a0-4725-a5d3-57a819b97550',
//     key: 'user:delete',
//     action: 'delete',
//     description: 'Can delete user'
//   },
//   {
//     id: '2aa1ceb9-039f-4465-be54-6b1ab6b1be12',
//     key: 'user:manage-roles',
//     action: 'manage-roles',
//     description: 'Can manage-roles user'
//   },
//   {
//     id: '6cc310c7-eeb0-4021-9d01-53c7fdd806dc',
//     key: 'user:read',
//     action: 'read',
//     description: 'Can read user'
//   },
//   {
//     id: '0b249757-f7e1-470a-a5b5-7e8e8cddc57d',
//     key: 'user:update',
//     action: 'update',
//     description: 'Can update user'
//   }
// ]

// }


