import { Grid } from 'react-loader-spinner';

export default function LoadingGrid({ loading }: { loading: boolean }) {
  return (
    <>
      {loading && (
        <Grid
          visible={true}
          height="80"
          width="80"
          color="#b91c1c"
          ariaLabel="grid-loading"
          radius="12.5"
          wrapperClass="grid-wrapper"
        />
      )}
    </>
  );
}
