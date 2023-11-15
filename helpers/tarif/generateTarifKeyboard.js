const generetaTarifKeyboard = (result)=>{
    const keyboard = [];
    let row = [];
    for (let i = 0; i <= result.length; i++) {
        const el = result[i]
console.log(el);
if (el !== undefined) {
    // row.push({ text: `${i + 1}`, callback_data:`tarif_${i + 1}` });
    row.push({ text: `${i + 1}`, callback_data:`tarif_${i + 1}` });
    if (row.length === 2 || i === result.length - 1 ) {
        keyboard.push(row);
        row = [];
      }
}
    

    }

    return keyboard;
}


module.exports = {
    generetaTarifKeyboard
}