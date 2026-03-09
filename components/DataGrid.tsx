import { ThreeDots } from 'react-loader-spinner';

export default function DataGrid({ loading }: { loading: boolean }) {
  return (
    <>
      {loading && (
        <ThreeDots
          visible={true}
          height="80"
          width="80"
          color="#4fa94d"
          radius="9"
          ariaLabel="three-dots-loading"
          wrapperClass="data-grid-wrapper"
        />
      )}
    </>
  );
}
