import { wire } from "./libraries/hyperHTML.js"

export const dynamicTemplateLiteral = template => ((vars = {}) => (new Function(...Object.keys(vars), `return \`${template}\`;`))(...Object.values(vars)))

export const dynamicTemplateWire = (template, helpers, id = "dynamicWire") => {
	const func = new Function("obj", "wire", "helpers", `return wire(obj, ":${id}")\`${template}\`;`)
	return (obj = {}) => func(obj, wire, helpers)
}
