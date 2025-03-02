class CMCA {
    constructor(computation, memorization, creativity, analysis) {
        this.computation = computation;
        this.memorization = memorization;
        this.creativity = creativity;
        this.analysis = analysis
    }
    printValues() {
        console.log([{
            c: this.computation
        },
        {
            m: this.memorization,
            cr: this.creativity,
            a: this.analysis
        }])
    }
}

export default CMCA;