const fs = require('fs');
const yaml = require('js-yaml');
const glob = require('glob');
const path = require('path')
const chalk = require('chalk');

function main() {

    const conf = readConfig("./config.yaml")
    const dirs = getDirectoriesByPattern(conf.json_directories_pattern)

    for (const dir of dirs) {
        const rules = conf["rules"][dir]
        const files = getFilesInDirectoryByPattern(dir, conf.json_files_pattern)
        if (files.length !== 2) {
            console.log(chalk.yellow('skipped: ') + `${dir} MUST contain two file`)
            break
        }
        console.log("we refer to the file in the below format: ")
        console.log(chalk.green('(1): ') + `${files[0]}`)
        console.log(chalk.blue('(2): ') + `${files[1]}`)

        const j1 = readJsonFile(files[0])
        const j2 = readJsonFile(files[1])

        console.log(dir, )
        console.log(`compare files in ${dir}:`)
        compareJsons(j1, j2, rules )
        console.log("----------------------------------")
    }


}

function compareJsons(j1, j2, rules) {
    compareJsonStructure(j1, j2)
    checkRules(chalk.green("(1)"), j1, rules)
    checkRules(chalk.blue('(2)'), j2, rules)


}

function compareJsonStructure(j1, j2) {
    const f1 = flattenJson(j1);
    const f2 = flattenJson(j2);
    console.log("\t compare structure: ")
    let typeIssues = []
    let typeCheckedKeys = []

    for (const e in f1) {
        if (!f2.hasOwnProperty(e)) {
            console.log("\t\t" + chalk.green('(1)') + ` has ${e} but ` + chalk.blue('(2)') + ` HAVEN'T`)

        } else {
            const t1 = typeof (f1[e])
            const t2 = typeof (f2[e])
            if (t1 !== t2) {
                typeIssues.push("\t\t" + chalk.red("type: ") + `${e} have type=${t1} in ` + chalk.green('(1)') + ` but it has type=${t2} in ` + chalk.blue('(2)'))
                typeCheckedKeys[e] = true
            }

        }
    }

    for (const e in f2) {
        if (!f1.hasOwnProperty(e)) {
            console.log("\t\t" + chalk.blue('(2)') + ` has ${e} but ` + chalk.green('(1)') + ` HAVEN'T`)

        }else {
            const t1 = typeof (f1[e])
            const t2 = typeof (f2[e])
            if (t1 !== t2 && typeCheckedKeys[e] === undefined) {
                typeIssues.push("\t\t" + chalk.red("type: ") + `${e} have type=${t1} in ` + chalk.green('(1)') + ` but it has type=${t2} in ` + chalk.blue('(2)'))
            }

        }
    }
    for (const typeIssue of typeIssues) {
        console.log(typeIssue)
    }

}

function checkRules(name, j, rules) {
    const f1 = flattenJson(j);
    console.log(`\t check rules for ${name}: `)

    let lengthRule = rules["length"];
    checkLengthRule(j, lengthRule)

}
function checkLengthRule(j , rule) {
    console.log("\t\t check length:")
    if (rule === undefined){
        return
    }

    for (const k in rule) {
        const instruction = rule[k].split(" ")
        let op1
        let op2

        switch (instruction[0]){
            case "eq":
                if (instruction.length !== 2){
                    throw new Error(`${instruction[0]} should have 2 operands`)
                }
                op1 = Number(instruction[1])
                if (!(j[k].length === op1)) {
                    console.log("\t\t\t" + chalk.red(k) + ` expected to equal ${op1} but its length is ${j[k].length}`)
                }
                break
            case "gt":
                if (instruction.length !== 2){
                    throw new Error(`${instruction[0]} should have 2 operands`)
                }
                op1 = Number(instruction[1])
                if (!(j[k].length > op1)) {
                    console.log("\t\t\t" + chalk.red(k) + ` expected to greater than ${op1} but its length is ${j[k].length}`)
                }
                break
            case "gte":
                if (instruction.length !== 2){
                    throw new Error(`${instruction[0]} should have 2 operands`)
                }
                op1 = Number(instruction[1])
                if (!(j[k].length >= op1)) {
                    console.log("\t\t\t" + chalk.red(k) + ` expected to greater than or equal to ${op1} but its length is ${j[k].length}`)
                }
                break
            case "lt":
                if (instruction.length !== 2){
                    throw new Error(`${instruction[0]} should have 2 operands`)
                }
                op1 = Number(instruction[1])
                if (!(j[k].length < op1)) {
                    console.log("\t\t\t" + chalk.red(k) + ` expected to lower than ${op1} but its length is ${j[k].length}`)
                }
                break
            case "lte":
                if (instruction.length !== 2){
                    throw new Error(`${instruction[0]} should have 2 operands`)
                }
                op1 = Number(instruction[1])
                if (!(j[k].length <= op1)) {
                    console.log("\t\t\t" + chalk.red(k) + ` expected to lower than or equal to ${op1} but its length is ${j[k].length}`)
                }
                break
            case "between":
                if (instruction.length !== 2){
                    throw new Error(`${instruction[0]} should have 3 operands`)
                }
                op1 = Number(instruction[1])
                op2 = Number(instruction[2])
                if (!(j[k].length >= op1 && j[k].length <= op2)) {
                    console.log("\t\t\t" + chalk.red(k) + ` expected to between ${op1} and ${op2} but its length is ${j[k].length}`)
                }
                break
        }
    }

}

function readJsonFile(jsonPath) {
    const jsonString = fs.readFileSync(jsonPath, 'utf-8')
    return JSON.parse(jsonString)
}

function getFilesInDirectoryByPattern(directoryPath, filePattern) {
    return glob.globSync(path.join(directoryPath, filePattern))
}

function getDirectoriesByPattern(pattern) {
    return glob.globSync(pattern)
}

function readConfig(path) {
    try {
        const fileContents = fs.readFileSync(path, 'utf8');
        return yaml.load(fileContents)

    } catch (e) {
        console.error('Error reading or parsing the YAML file:', e);
    }

}

function arrayToMap(arr) {
    return arr.reduce((acc, curr) => {
        acc[curr] = true;  // or any other default value you want
        return acc;
    }, {});
}

function iterateNestedJson(json, callback, prefix = '') {
    for (let key in json) {
        if (json.hasOwnProperty(key)) {
            const newPrefix = prefix ? `${prefix}.${key}` : key;
            if (typeof json[key] === 'object' && json[key] !== null && !Array.isArray(json[key])) {
                iterateNestedJson(json[key], callback, newPrefix);
            } else {
                callback(newPrefix, json[key]);
            }
        }
    }
}

function flattenJson(obj, prefix = '', result = {}) {
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            const newPrefix = prefix ? `${prefix}.${key}` : key;
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                flattenJson(obj[key], newPrefix, result);
            } else {
                result[newPrefix] = obj[key];
            }
        }
    }
    return result;
}

main()

