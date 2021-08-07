const { Signal, PinDirection, SimpleLogicModule } = require('jslogiccircuit');

/**
 * 多路分配器
 *
 * 一路输入，根据选择信号，从 N 路当中的其中一路输出。
 * 如果使用门模块来构造多路分配器，通常还有一个 'Enable' 使能输入端口，可用于
 * 串联多个多路分配器。（《实用电子元器件与电路基础》P.569）
 */
class Demultiplexer extends SimpleLogicModule {

    // override
    init() {
        // 选择端口的数据位宽
        this._selectPinBitWidth = this.getParameter('selectPinBitWidth');

        // 数据宽度
        this._bitWidth = this.getParameter('bitWidth');

        // 选择端口
        this._pinSelect = this.addPin('select', this._selectPinBitWidth, PinDirection.input);

        // 输入端口
        this._pinIn = this.addPin('in', this._bitWidth, PinDirection.input);

        // 输出端口的名称分别为 out_0, out_1, ... out_N
        this._outputPinCount = Math.pow(2, this._selectPinBitWidth);
        for (let idx = 0; idx < this._outputPinCount; idx++) {
            this.addPin('out_' + idx, this._bitWidth, PinDirection.output);
        }

        // 常量信号
        this._signalLow = Signal.createLow(this._bitWidth);
    }

    // override
    updateModuleState() {
        let signalSelection = this._pinSelect.getSignal();

        let selectedIndex = signalSelection.getLevel().toInt32();
        let signalIn = this._pinIn.getSignal();

        let outputPins = this.getOutputPins();
        for (let idx = 0; idx < this._outputPinCount; idx++) {
            if (idx === selectedIndex) {
                outputPins[idx].setSignal(signalIn);
            } else {
                outputPins[idx].setSignal(this._signalLow);
            }
        }
    }
}

module.exports = Demultiplexer;