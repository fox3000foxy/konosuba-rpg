function encode3y3(str: string) {
    const encodedCPs = [];
    for (let i = 0; i < str.length; i++)
        encodedCPs.push(str.codePointAt(i) as number+ 0xE0000);
    return String.fromCodePoint(...encodedCPs);
}

function decode3y3(bio: string) {
    const decoded3y3 = ["", "", ""];
    const bioCPs = [...bio];
    if (bioCPs.length > 0) {
        let tempCPs = [];
        let i = 0;
        for (let j = 0; j < bioCPs.length; j++) {
            const currCP = bioCPs[j].codePointAt(0) as number;
            if (currCP === 0xE007E) {
                if (tempCPs.length > 0)
                    decoded3y3[i] = String.fromCodePoint(...tempCPs);
                if (i > 1) break;
                tempCPs = [];
                i++;
            } else if (0xE0000 < currCP && currCP < 0xE007E) {
                tempCPs.push(currCP - 0xE0000);
                if (j === bioCPs.length - 1)
                    decoded3y3[i] = String.fromCodePoint(...tempCPs);
            } else if (i > 0) {
                if (tempCPs.length > 0)
                    decoded3y3[i] = String.fromCodePoint(...tempCPs);
                break;
            }
        }
    }
    return decoded3y3.join("");
}

export { decode3y3, encode3y3 };

