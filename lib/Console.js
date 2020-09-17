const Color = require("color"),
    chalk = require("chalk");

class Console {
    constructor(product, color) {
        this.product = product;
        this.color = Shades(color);
        this.red = Shades("rgb(204,54,50)");
    }

    Log(out) {
        const {
            dark,
            base,
            light
        } = this.color;
        let time = TimeStamp();
        process.stdout.write(
            `${chalk.hex(dark).bold(time)} ${chalk.hex(base)(`[${this.product}]`)} ${chalk.hex(light)(out)}\n`
        );
    }

    Error(out) {
        const {
            dark,
            base,
            light
        } = this.red;
        let time = TimeStamp();
        process.stderr.write(
            `${chalk.hex(dark).bold(time)} ${chalk.hex(base)(`[${this.product}]`)} ${chalk.hex(light)(`ERROR: ${out}`)}\n`
        );
    }
}
module.exports = Console;

function Shades(baseColor) {
    color = Color(baseColor);
    return {
        base: color.hex().toString(),
        dark: color.darken(0.3).hex().toString(),
        light: color.lighten(0.3).hex().toString(),
    };
}

function Pad(num, size) {
    return `${num}`.padStart(size, "0");
}

function TimeStamp() {
    let now = new Date();
    return `[${now.getFullYear()}-${Pad(now.getMonth(), 2)}-${Pad(now.getDate(), 2)} ${Pad(now.getHours(), 2)}:${Pad(
        now.getMinutes(),
        2
    )}:${Pad(now.getSeconds(), 2)}]`;
}