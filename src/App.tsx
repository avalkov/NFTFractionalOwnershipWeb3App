import * as React from 'react';
import styled from 'styled-components';

import Web3Modal from 'web3modal';
// @ts-ignore
import WalletConnectProvider from '@walletconnect/web3-provider';
import Column from './components/Column';
import Wrapper from './components/Wrapper';
import Header from './components/Header';
import Loader from './components/Loader';
import ConnectButton from './components/ConnectButton';
import MintNFT from './components/MintNFT';
import FractionalizeNFT from './components/FractionalizeNFT';
import Menu from './components/Menu'

import { Web3Provider } from '@ethersproject/providers';
import { getChainData } from './helpers/utilities';


// ROPSTEN
const SIMPLE_NFT_ADDRESS = '0x149Af67a17D1F152A1b0C849C897DFcf63ac2a14';
const FRACTIONALIZE_NFT_ADDRESS = '0x872fcfF0e5CC477Fd7882022f4745E7cd511E1Ff';

const SLayout = styled.div`
  position: relative;
  width: 100%;
  min-height: 100vh;
  text-align: center;
`;

const SContent = styled(Wrapper)`
  width: 100%;
  height: 100%;
  padding: 0 16px;
`;

const SContainer = styled.div`
  height: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  word-break: break-word;
`;

const SLanding = styled(Column)`
  height: 600px;
`;

// @ts-ignore
const SBalances = styled(SLanding)`
  height: 100%;
  & h3 {
    padding-top: 30px;
  }
`;

interface IAppState {
  fetching: boolean;
  address: string;
  library: any;
  connected: boolean;
  chainId: number;
  pendingRequest: boolean;
  result: any | null;
  electionContract: any | null;
  info: any | null;
  mintingSelected: boolean;
  fractionalizationProtocolSelected: boolean;
}

const INITIAL_STATE: IAppState = {
  fetching: false,
  address: '',
  library: null,
  connected: false,
  chainId: 1,
  pendingRequest: false,
  result: null,
  electionContract: null,
  info: null,
  mintingSelected: false,
  fractionalizationProtocolSelected: false
};

class App extends React.Component<any, any> {
  // @ts-ignore
  public web3Modal: Web3Modal;
  public state: IAppState;
  public provider: any;

  constructor(props: any) {
    super(props);
    this.state = {
      ...INITIAL_STATE
    };

    this.web3Modal = new Web3Modal({
      network: this.getNetwork(),
      cacheProvider: true,
      providerOptions: this.getProviderOptions()
    });
  }

  public componentDidMount() {
    if (this.web3Modal.cachedProvider) {
      this.onConnect();
    }
  }

  public onConnect = async () => {
    this.provider = await this.web3Modal.connect();

    const library = new Web3Provider(this.provider);

    const network = await library.getNetwork();
  
    const address = this.provider.selectedAddress ? this.provider.selectedAddress : this.provider?.accounts[0];

    await this.setState({
      library,
      chainId: network.chainId,
      address,
      connected: true
    });

    await this.subscribeToProviderEvents(this.provider);

  };

  public subscribeToProviderEvents = async (provider:any) => {
    if (!provider.on) {
      return;
    }

    provider.on("accountsChanged", this.changedAccount);
    provider.on("networkChanged", this.networkChanged);
    provider.on("close", this.close);

    await this.web3Modal.off('accountsChanged');
  };

  public async unSubscribe(provider:any) {
    // Workaround for metamask widget > 9.0.3 (provider.off is undefined);
    window.location.reload(false);
    if (!provider.off) {
      return;
    }

    provider.off("accountsChanged", this.changedAccount);
    provider.off("networkChanged", this.networkChanged);
    provider.off("close", this.close);
  }

  public changedAccount = async (accounts: string[]) => {
    if(!accounts.length) {
      // Metamask Lock fire an empty accounts array 
      await this.resetApp();
    } else {
      await this.setState({ address: accounts[0] });
    }
  }

  public networkChanged = async (networkId: number) => {
    const library = new Web3Provider(this.provider);
    const network = await library.getNetwork();
    const chainId = network.chainId;
    await this.setState({ chainId, library });
  }
  
  public close = async () => {
    this.resetApp();
  }

  public getNetwork = () => getChainData(this.state.chainId).network;

  public getProviderOptions = () => {
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: process.env.REACT_APP_INFURA_ID
        }
      }
    };
    return providerOptions;
  };

  public resetApp = async () => {
    await this.web3Modal.clearCachedProvider();
    localStorage.removeItem("WEB3_CONNECT_CACHED_PROVIDER");
    localStorage.removeItem("walletconnect");
    await this.unSubscribe(this.provider);

    this.setState({ ...INITIAL_STATE });

  };

  public render = () => {
    const {
      address,
      connected,
      chainId,
      fetching
    } = this.state;
    return (
      <SLayout>
        <Column maxWidth={1000} spanHeight>
          <Header
            connected={connected}
            address={address}
            chainId={chainId}
            killSession={this.resetApp}
          />
          <SContent>
            {fetching ? (
              <Column center>
                <SContainer>
                  <Loader />
                </SContainer>
              </Column>
            ) : (
                <div>
                {this.state.connected && <Menu items={[
                    {label: "Minting", selected: this.state.mintingSelected, onclick: this.showMinting}, 
                    {label: "Fractionalization Protocol", selected: this.state.fractionalizationProtocolSelected, 
                    onclick: this.showFractionalizationProtocol}
                  ]} />}
                <SLanding center>
                  {!this.state.connected && <ConnectButton onClick={this.onConnect} />}
                  {this.state.connected && this.state.mintingSelected 
                    && <MintNFT contractAddress={SIMPLE_NFT_ADDRESS} library={this.state.library} account={address} />}
                  {this.state.connected && this.state.fractionalizationProtocolSelected 
                    && <FractionalizeNFT fractionalizationProtocolContractAddress={FRACTIONALIZE_NFT_ADDRESS} 
                    nftsContractAddress={SIMPLE_NFT_ADDRESS}
                    library={this.state.library} account={address} />}
                </SLanding>
                </div>
              )}
          </SContent>
        </Column>
      </SLayout>
    );
  };

  private showMinting = () => {
    if (this.state.mintingSelected) {
      return;
    }

    this.setState({ fractionalizationProtocolSelected: false, mintingSelected: true });
  };

  private showFractionalizationProtocol = () => {
    if (this.state.fractionalizationProtocolSelected) {
      return;
    }

    this.setState({ fractionalizationProtocolSelected: true, mintingSelected: false });
  };
}

export default App;
