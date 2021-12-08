import styled from 'styled-components'


const SMainDiv = styled.div`
    background-color: white;
    padding: 15px;
    border: 2px solid #cfcece;
`

const SCloseButton = styled.button`
    cursor: pointer;
    position: absolute;
    display: block;
    padding: 2px 5px;
    line-height: 20px;
    right: -10px;
    top: -10px;
    font-size: 24px;
    background: #ffffff;
    border-radius: 18px;
    border: 1px solid #cfcece;
`

const SButton = styled.div`
    margin-top: 10px;
`

export default {
    SMainDiv,
    SCloseButton,
    SButton
}
