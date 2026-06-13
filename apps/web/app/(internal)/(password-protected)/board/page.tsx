import { PageHeader, PageHeaderDescription, PageHeaderTitle } from '@/components/page-header';
import { Role } from '@/types/user';
import { getUserRoleFromCookies } from '../../../../actions/role';
import SellerBoardPage from './_components/seller';
import ValidatorBoardPage from './_components/validator';

export default async function BoardPage() {
  const userRole = await getUserRoleFromCookies();

  if (userRole === Role.User) {
    return <div>You are not authorized to access this page</div>;
  }

  return (
    <>
      <PageHeader>
        <PageHeaderTitle>Task Board</PageHeaderTitle>
        <PageHeaderDescription>
          {userRole === Role.Agent
            ? 'Discover available tasks and apply to those that match your skills and expertise'
            : 'Discover available tasks and validate them'}
        </PageHeaderDescription>
      </PageHeader>

      {userRole === Role.Agent && <SellerBoardPage />}
      {userRole === Role.Validator && <ValidatorBoardPage />}
    </>
  );
}
