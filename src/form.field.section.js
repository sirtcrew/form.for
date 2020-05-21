import { FieldContainer } from "./form.fieldContainer.js"

export class SectionField extends FieldContainer {
	onchange(e) {

	}
	get view() {
		return {
			content: this.visible ? this.template(this) : "",
			style: this.disabled ? "background-color: rgba(84, 84, 84, 0.06); opacity: 0.7;" : ""
		}
	}
}