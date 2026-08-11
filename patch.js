const fs = require('fs');
let code = fs.readFileSync('src/app/(auth)/login/page.tsx', 'utf8');
code = code.replace(
  'if (isAuthenticated && user?.role) {',
  'if (isAuthenticated) {\n      if (!user?.role) {\n        useAuthStore.getState().clearUser();\n        return;\n      }'
);
fs.writeFileSync('src/app/(auth)/login/page.tsx', code);
