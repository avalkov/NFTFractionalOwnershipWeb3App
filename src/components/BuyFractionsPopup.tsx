import React from 'react'
import Button from './Button'
import popupStyles from './PopupStyles'


const BuyFractionsPopup = (props: any) => {
    const [amount, setAmount] = React.useState(1)

    const submit = () => {
        if (amount < 1) {
            alert("Invalid amount")
            return
        }

        props.buyFractions(amount)
    }

    return (
        <popupStyles.SMainDiv>
            <popupStyles.SCloseButton className='close' onClick={props.close}>&times;</popupStyles.SCloseButton>

            <div>Amount:</div>
            <input type='number' min='1' value={amount} onChange={(e) => {setAmount(parseInt(e.target.value, 10))}} />

            <popupStyles.SButton>
                <Button onClick={submit} children={React.createElement('span', null, 'Submit')} />
            </popupStyles.SButton>
        </popupStyles.SMainDiv>
    )
}

export default BuyFractionsPopup
