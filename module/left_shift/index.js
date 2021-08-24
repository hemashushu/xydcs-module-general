const { Binary } = require('jsbinary');
const { Signal, PinDirection, SimpleLogicModule } = require('jslogiccircuit');

/**
 * 计数器，上升边沿触发。
 *
 * - 初始值为 0，第一次时钟上升沿时输出 1,第二次输出 2,如此类推。
 *   当所有输出位为 1 时，'Overflow' 端口输出高电平，然后下一次
 *   时钟上升沿之后输出 0。
 * - 'Overflow' 端口可以用于串联多个计数器。
 * - 当 'Reset' 端口为高电平时，计数器会复位为 0。
 */
class LeftShift extends SimpleLogicModule {

    // override
    init() {
        // 输出端口 out 的位宽
        this._bitWidth = this.getParameter('bitWidth');

        // 移动的位数
        this._count = this.getParameter('count');

        // 输入端口
        this._pinIn = this.addPin('in', this._bitWidth, PinDirection.input);

        // 输出端口
        this._pinOut = this.addPin('out', this._bitWidth, PinDirection.output);
    }

    // override
    updateModuleState() {
        // TODO::
    }
}

module.exports = LeftShift;