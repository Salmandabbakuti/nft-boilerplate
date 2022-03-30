export default function NFTCard(props) {
  return (
    <div className="card">
      <img src={props.image} alt="broken-img" className="card__img" />
      <div className="card__body">
        <h2 className="card__title">{props.name}</h2>
        <p className="card__description">{props.description}</p>
        <h3 className="card__price">{props.price} ETH</h3>
        <p className="card__owner">{`${props.owner.slice(0, 5)}...${props.owner.slice(-5)}`}</p>
        {props.isForSale && (<button
          className="card__btn"
          onClick={props.handleBuyNFT}
        >
          Buy
        </button>
        )}
      </div>
    </div>
  );
}