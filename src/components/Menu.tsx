import React from 'react'
import styled from 'styled-components'


const SItem = styled.span`
    padding: 10px;
    cursor: pointer;
`

const SLabel = styled.label`
    cursor: pointer;
`

const Menu = (props: any) => {
    const items = []
    for (const entry of props.items) {
        items.push(<SItem key={items.length} style={{backgroundColor: entry.selected === true ? "#33ccff" : "white"}} onClick={entry.onclick}>
                <SLabel>{entry.label}</SLabel>
            </SItem>)
    }

    return (
        <div>
            {items}
        </div>
    )
}

export default Menu
