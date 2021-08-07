const { PinDirection, SimpleLogicModule } = require('jslogiccircuit');

/**
 * 复用器
 *
 * 多路输入，根据选择信号，选择其中一路的信号输出。
 *
 */
class Multiplexer extends SimpleLogicModule {

    // override
    init() {
        // 选择端口的数据位宽
        this._selectPinBitWidth = this.getParameter('selectPinBitWidth');

        // 数据宽度
        this._bitWidth = this.getParameter('bitWidth');

        // 选择端口
        this._pinSelect = this.addPin('select', this._selectPinBitWidth, PinDirection.input);

        // 输出端口
        this._pinOut = this.addPin('out', this._bitWidth, PinDirection.output);

        // 输入端口的名称分别为 in_0, in_1, ... in_N
        this.candidatePins = [];

        // 输入端口
        let inputPinCount = Math.pow(2, this._selectPinBitWidth);
        for (let idx = 0; idx < inputPinCount; idx++) {
            let candidatePin = this.addPin('in_' + idx, this._bitWidth, PinDirection.input);
            this.candidatePins.push(candidatePin);
        }
    }

    // override
    updateModuleState() {
        let signalSelection = this._pinSelect.getSignal();

        let selectedIndex = signalSelection.getLevel().toInt32();
        let selectedInputPin = this.candidatePins[selectedIndex];
        let signalSelected = selectedInputPin.getSignal();

        this._pinOut.setSignal(signalSelected);
    }
}

module.exports = Multiplexer;