# typed-report
Determine type coverage usage of any type in typescript, among other things 


Clone the repo and install dependencies

```bash
npm install
```

To test/install it locally you can run, from the root directory in your console: 

```bash
npm run build
npm link
```

To get a report of coverage you can run `typed-report coverage <path/to/your/project/tsconfig.json>`

```bash
typed-report coverage tsconfig.json
```

To exclude spec files from the report 
```bash
typed-report coverage -e tsconfig.json
```

Display top 10 most used types
```bash
typed-report coverage -u tsconfig.json
```