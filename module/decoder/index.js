const { Signal, PinDirection, SimpleLogicModule } = require('jslogiccircuit');

/**
 * 制译码，二进制（BCD）转“十进制”
 *
 */
class Decoder extends SimpleLogicModule {

    // override
    init() {
        // 输入端口的数量
        this._inputPinCount = this.getParameter('inputPinCount');

        // 输入端口
        for (let idx = 0; idx < this._inputPinCount; idx++) {
            this.addPin('in_' + idx, 1, PinDirection.input);
        }

        // 输出端口的数量，
        // 其值为（2 ^ 位宽 - 1），比如位宽为 3 时，一共可以表达 8 种输出情况，包括：
        // - 0b111 （7）个输入端口每个端口依次为 1 的情况 +
        // - 一个所有输入端口都为 0 的情况。

        this._outputPinCount = Math.pow(2, this._inputPinCount) - 1;

        // 输出端口的名称分别为 out_0, out_1, ... out_N
        for (let idx = 0; idx < this._outputPinCount; idx++) {
            this.addPin('out_' + idx, 1, PinDirection.output);
        }

        // 常量信号
        this._signalLow = Signal.createLow(1);
        this._signalHigh = Signal.createHigh(1);
    }

    // override
    updateModuleState() {
        let value = 0;
        for (let idx = 0; idx < this._inputPinCount; idx++) {
            let inputPin = this.inputPins[idx];
            let levelInt32 = inputPin.getSignal().getLevel().toInt32(); // 0 or 1
            value = value + Math.pow(2, idx) * levelInt32;
        }

        if (value === 0) {
            for (let idx = 0; idx < this._outputPinCount; idx++) {
                this.outputPins[idx].setSignal(this._signalLow);
            }

        } else {
            let outputPinIndex = value - 1;
            for (let idx = 0; idx < this._outputPinCount; idx++) {
                if (idx === outputPinIndex) {
                    this.outputPins[idx].setSignal(this._signalHigh);
                } else {
                    this.outputPins[idx].setSignal(this._signalLow);
                }
            }
        }
    }
}

module.exports = Decoder;