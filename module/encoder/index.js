const { Signal, PinDirection, SimpleLogicModule } = require('jslogiccircuit');

/**
 * 十进制-二进制（BCD）优先编码器
 *
 * 输出输入端口的电平为高电平的端口的索引值，比如共有 4 个输入端口，
 * in_3 为高电平时，输出 4， in_0 为高电平时，输出 1，
 * 如果 in_3 和 in_0 同时为高电平，则输出 4。
 */
class Encoder extends SimpleLogicModule {

    // override
    init() {
        // 输出端口的数量
        this._outputPinCount = this.getParameter('outputPinCount');

        // 输出端口
        for (let idx = 0; idx < this._outputPinCount; idx++) {
            this.addPin('out_' + idx, 1, PinDirection.output);
        }

        // 输入端口的数量，
        // 其值为（2 ^ 位宽 - 1），比如位宽为 3 时，一共可以表达 8 种输出情况，包括：
        // - 0b111 （7）个输入端口每个端口依次为 1 的情况 +
        // - 一个所有输入端口都为 0 的情况。

        this._inputPinCount = Math.pow(2, this._outputPinCount) - 1;

        // 输入端口的名称分别为 in_0, in_1, ... in_N
        for (let idx = 0; idx < this._inputPinCount; idx++) {
            this.addPin('in_' + idx, 1, PinDirection.input);
        }

        this._signalLow = Signal.createLow(1);
        this._signalHigh = Signal.createHigh(1);
    }

    // override
    updateModuleState() {
        let value = 0;
        // 从高位开始检测，第一个为 1 的位所对应的索引（+1）将会成为输出值
        for (let idx = this._inputPinCount - 1; idx >= 0; idx--) {
            let inputPin = this.inputPins[idx];
            let levelInt32 = inputPin.getSignal().getLevel().toInt32(); // 0 or 1
            if (levelInt32 === 1) {
                value = idx + 1;
                break;
            }
        }

        for (let idx = 0; idx < this._outputPinCount; idx++) {
            let isHigh = (value & 1 === 1);
            this.outputPins[idx].setSignal(
                isHigh ? this._signalHigh : this._signalLow);

            value = value >> 1;
        }
    }
}

module.exports = Encoder;