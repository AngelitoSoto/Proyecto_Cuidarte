const scanner = require('sonarqube-scanner');

// Permite usar token o credenciales directas (admin/admin o personalizadas)
const token = process.env.SONAR_TOKEN || 'squ_31ed387a2fdc8435eefde9d12ab265dd3243871a';
const hostUrl = process.env.SONAR_HOST_URL || 'http://127.0.0.1:9000';

scanner(
  {
    serverUrl: hostUrl,
    options: {
      'sonar.host.url': hostUrl,
      'sonar.projectKey': 'cuidarte-plus',
      'sonar.projectName': 'Cuidarte+ Sistema de Examenes Medicos',
      'sonar.projectVersion': '1.0.0',
      'sonar.login': token,
      'sonar.sources': 'src',
      'sonar.tests': 'tests',
      'sonar.sourceEncoding': 'UTF-8',
      'sonar.javascript.lcov.reportPaths': 'coverage/lcov.info',
      'sonar.exclusions': '**/node_modules/**,**/uploads/**,**/coverage/**,**/dist/**'
    }
  },
  () => {
    console.log('>> Análisis SonarQube finalizado exitosamente.');
    process.exit(0);
  }
);
