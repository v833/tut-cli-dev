const inquirer = require('inquirer')
inquirer
  .prompt([
    {
      type: 'input',
      name: 'yourName',
      message: 'your name: ',
      default: 'noname',
      validate: function (v) {
        if (typeof v === 'string') return true
      },
      transformer: function (v) {
        return `name ${v}`
      },
      filter: function (v) {
        return (v += 'haha')
      }
    },
    {
      type: 'number',
      name: 'yourNumber',
      message: 'your number: '
    },
    {
      type: 'confirm',
      name: 'choice',
      message: 'your choice: '
    },
    {
      type: 'list',
      name: 'yourList',
      message: 'your list: ',
      default: 0, // index
      choices: [
        { value: 1, name: 'one' },
        { value: 2, name: 'two' },
        { value: 3, name: 'three' }
      ]
    },
    {
      type: 'checkbox',
      name: 'yourCheckbox',
      message: 'your checkbox: ',
      default: 0, // index
      choices: [
        { value: 1, name: 'one' },
        { value: 2, name: 'two' },
        { value: 3, name: 'three' }
      ]
    }
  ])
  .then((answers) => {
    console.log('answers: ', answers)
  })
  .catch((err) => {
    if (err.isTryErrot) {
    } else {
    }
  })
