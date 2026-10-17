// تبدیل playwright-report/results.json به annotation قابل‌خواندن در GitHub.
// دلیل: متن لاگِ job و zipِ artifact با توکن این ماشین خواندنی نیستند (403/401)،
// پس بدون این، شغلِ e2e می‌تواند ساعت‌ها قرمز بماند و فقط «exit code 1» دیده شود.
// usage: node scripts/e2e-annotations.mjs [playwright-report/results.json]
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const file = resolve(process.argv[2] || 'playwright-report/results.json')

let report
try {
  report = JSON.parse(readFileSync(file, 'utf8'))
} catch (e) {
  console.log(`::warning::گزارش jsonِ e2e خوانده نشد (${e.message}) — تست‌ها به reporter نرسیدند`)
  process.exit(0)
}

const emit = (level, title, message, filePath, line) => {
  let params = `title=${title}`
  if (filePath) params += `,file=${filePath}`
  if (line) params += `,line=${line}`
  console.log(`::${level} ${params}::${String(message).replace(/\r?\n/g, ' ⏎ ').slice(0, 900)}`)
}

const walk = (suite, out) => {
  for (const spec of suite.specs || []) out.push(spec)
  for (const child of suite.suites || []) walk(child, out)
}

const specs = []
for (const suite of report.suites || []) walk(suite, specs)

const failures = []
for (const spec of specs) {
  for (const test of spec.tests || []) {
    // با retry، نتیجۀ اول می‌تواند failed باشد و تست در نهایت سبز شده باشد؛
    // تنها آخرین تلاش قضاوت می‌شود وگرنه هر flaky سبز به‌طور کاذب خطا می‌دهد
    const last = (test.results || []).at(-1)
    if (!last || last.status === 'passed' || last.status === 'skipped') continue
    const err = last.errors?.[last.errors.length - 1] || last.error || {}
    failures.push({
      title: spec.title,
      file: spec.file,
      line: err.location?.line,
      status: last.status,
      message: err.message || err.snippet || '(بدون پیام)',
    })
  }
}

const stats = report.stats || {}
console.log(
  `::notice title=E2E summary::${specs.length} spec؛ ` +
  `expected=${stats.expected ?? '-'} unexpected=${stats.unexpected ?? '-'} ` +
  `flaky=${stats.flaky ?? '-'} skipped=${stats.skipped ?? '-'}`
)

if (!failures.length) {
  console.log('::notice title=E2E::همۀ تست‌های e2e سبز بودند')
} else {
  for (const f of failures) {
    emit('error', `E2E FAIL (${f.status}) ${f.title}`, f.message, f.file, f.line)
  }
}
