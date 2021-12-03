import purify from './purifycss'

const themeList = [
    { name: 'indigo', color: '#6366f1' },
    { name: 'yellow', color: '#f59e0b' },
    { name: 'red', color: '#f56565' },
    { name: 'purple', color: '#9f7aea' },
    { name: 'pink', color: '#ed64a6' },
    { name: 'blue', color: '#4299e1' },
    { name: 'green', color: '#48bb78' },
]

const colorRegex = new RegExp(
    /(bg|text|border|ring)-(red|yellow|green|blue|indigo|purple|green)-(\d\d\d)/,
    'g',
)

const getUpdateThemeModal = (editor) => {
    const md = editor.Modal
    const pfx = editor.getConfig().stylePrefix

    const container = document.createElement('div')

    const containerBody = document.createElement('div')
    containerBody.style.padding = '40px 0px'
    containerBody.style.display = 'flex'
    containerBody.style.justifyContent = 'center'

    let selectedTheme
    themeList.forEach((theme) => {
        const btnColor = document.createElement('button')
        btnColor.className = 'change-theme-button'
        btnColor.style.backgroundColor = theme.color
        btnColor.onclick = () => (selectedTheme = theme)

        containerBody.appendChild(btnColor)
    })

    const containerFooter = document.createElement('div')

    const btnEdit = document.createElement('button')
    btnEdit.innerHTML = 'Update'
    btnEdit.className = pfx + 'btn-prim ' + pfx + 'btn-import'
    btnEdit.style.float = 'right'
    btnEdit.onclick = () => {
        updateThemeColor(editor, selectedTheme.name)
        md.close()
    }

    // box-shadow: 0 0 0 2pt #c5c5c575
    containerFooter.appendChild(btnEdit)

    container.appendChild(containerBody)
    container.appendChild(containerFooter)
    return container
}

const getAllComponents = (model, result = []) => {
    result.push(model)
    model.components().each((mod) => getAllComponents(mod, result))
    return result
}

const updateThemeColor = (editor, color) => {
    const wrapper = editor.DomComponents.getWrapper()
    const componentsAll = getAllComponents(wrapper, [])
    componentsAll.forEach((c) => {
        const { el } = c.view
        if (typeof el.className?.baseVal === 'string' && el.className?.baseVal.match(colorRegex)) {
            el.className.baseVal = el.className.baseVal.replace(colorRegex, `$1-${color}-$3`)
            c.replaceWith(el.outerHTML)
        } else if (typeof el.className === 'string' && el.className.match(colorRegex)) {
            el.className = el.className.replace(colorRegex, `$1-${color}-$3`)
            c.replaceWith(el.outerHTML)
        }
    })
}

export default (editor, opts = {}) => {
    const cm = editor.Commands;

    cm.add('open-update-theme', {
        run(_, sender) {
            sender?.set && sender.set('active', 0)
            const md = editor.Modal
            md.setTitle(opts.changeThemeText)
            const container = getUpdateThemeModal(editor)
            md.setContent(container)
            md.open()
        },
    })

    cm.add('get-tailwindCss', {
        run(editor, sender, options = {}) {
            sender?.set && sender.set('active', 0)
            const {
                html = editor.getHtml(),
                css,
                purifyOpts = {},
                callback = pcss => console.log(pcss)
            } = options
            if (!css) {
                fetch(opts.tailwindCssUrl)
                    .then(res => res.text())
                    .then(tcss => {
                        purify(html, tcss, purifyOpts, callback)
                    })
            } else {
                purify(html, css, purifyOpts, clb)
            }
        }
    })
}