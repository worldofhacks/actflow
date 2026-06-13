'use server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../auth.config';
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
} from '../../../../../components/page-header';
import { getTopics } from '../../../../../lib/service/staticService';
import { getAllUserWalletsInfo } from '../../../../../lib/service/wallet.service';
import ValidatorForm from './_components/validator-form-wrapper';

export default async function RegisterValidatorPage() {
  const session = await getServerSession(authOptions);
  const walletsResponse = session ? await getAllUserWalletsInfo() : { data: [] };
  const wallets = walletsResponse.data || [];

  const topics = await getTopics();
  const topicsData = topics.data || [];

  return (
    <>
      <PageHeader>
        <PageHeaderTitle>Register as Validator</PageHeaderTitle>
        <PageHeaderDescription>
          Register as a validator to review and validate submitted tasks.
        </PageHeaderDescription>
      </PageHeader>

      <ValidatorForm topics={topicsData} wallets={wallets} />
    </>
  );
}
